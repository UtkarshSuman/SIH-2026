"""
NDVI (vegetation index) from Agromonitoring (https://agromonitoring.com).
Fills `vegetation_index` for LANDSLIDE (bare/sparse vegetation on a slope
raises landslide risk; dense cover lowers it).

NOT free-keyless like the other new providers: Agromonitoring requires a
free registration but its free tier (1,000 calls/day) comfortably covers
a hackathon demo or a small pilot deployment at zero cost -- it only
becomes a paid concern (~$0 base + per-call after quota) at real
production scale. Put the key in providers.yaml as
`${AGROMONITORING_API_KEY}` (see config.py's ${VAR} expansion).

Agromonitoring's NDVI endpoint needs a *polygon* registered first (it's
built for farm fields, not arbitrary points), which is a second round
trip. We approximate a small square polygon around the bbox center so
one zone = one polygon, then request the latest available NDVI image
stats for it. STATIC-ish/slow-changing (satellite revisit is ~5-10 days)
-- cache ~3-5 days.

Polygon IDs are cached to disk (`data/vegetation_polygon_ids.json`), keyed
by zone, and reused across calls -- see `_get_or_create_polygon_id`'s
docstring for why this matters, not just as an efficiency nicety.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional

from ..core.base import BBox, Feature, GISDataProvider
from ..core.registry import register_provider

_POLYGON_CACHE_PATH = Path("data/vegetation_polygon_ids.json")


def _load_polygon_cache() -> dict:
    if not _POLYGON_CACHE_PATH.exists():
        return {}
    try:
        return json.loads(_POLYGON_CACHE_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        return {}  # corrupt/unreadable cache -- fall back to re-registering


def _save_polygon_cache(cache: dict) -> None:
    _POLYGON_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _POLYGON_CACHE_PATH.write_text(json.dumps(cache))


@register_provider("vegetation")
class AgromonitoringNDVIProvider(GISDataProvider):
    requires_api_key = True
    POLYGON_URL = "https://api.agromonitoring.com/agro/1.0/polygons"
    NDVI_URL = "https://api.agromonitoring.com/agro/1.0/ndvi/history"

    async def fetch(self, bbox: BBox, **params) -> list:
        api_key = self.config.get("api_key")
        if not api_key:
            raise RuntimeError(
                "vegetation provider requires AGROMONITORING_API_KEY "
                "(free tier at https://agromonitoring.com/) set in providers.yaml"
            )

        lon, lat = bbox.center
        zone_key = f"zone-{lat:.4f}-{lon:.4f}"

        polygon_id = await self._get_or_create_polygon_id(zone_key, lon, lat, api_key)
        vegetation_index = await self._fetch_ndvi(polygon_id, api_key)

        geometry = {"type": "Point", "coordinates": [lon, lat]}
        return [Feature(
            geometry=geometry,
            properties={"vegetation_index": vegetation_index},
            source=self.name,
        )]

    async def _get_or_create_polygon_id(self, zone_key: str, lon: float, lat: float, api_key: str) -> str:
        """Reuse a previously-registered polygon for this zone instead of
        creating a brand-new one on every call.

        Bug this fixes: without a cache, every retry (and every re-run)
        called POST .../polygons again, each one returning a *different*
        polygon id for the same zone -- visible directly in one ingest
        run's logs as two different `polyid` values across the two retry
        attempts. Every one of those "new" polygons was also too freshly
        created for Agromonitoring to have indexed any satellite imagery
        for yet, so the immediately-following /ndvi/history call 404'd
        every time -- the retries were retrying into a fresh 404 rather
        than giving one polygon a chance to become queryable.

        `"duplicated": "true"` is left as-is on the create call (rather
        than switched to "false") because earlier runs already registered
        several duplicate polygons per zone under this account; asking
        Agromonitoring to reject duplicates now would just turn those
        pre-existing dupes into a hard error on the next fresh
        registration. This cache is what actually stops new duplicates
        from accumulating going forward -- once a zone's id is cached,
        this method returns it directly and never calls the create
        endpoint again for that zone.
        """
        cache = _load_polygon_cache()
        if zone_key in cache:
            return cache[zone_key]

        delta = 0.001  # ~100m square, small enough to stay "one point"
        square = {
            "name": zone_key,
            "geo_json": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon - delta, lat - delta], [lon + delta, lat - delta],
                        [lon + delta, lat + delta], [lon - delta, lat + delta],
                        [lon - delta, lat - delta],
                    ]],
                },
            },
        }
        async with self.session.post(
            self.POLYGON_URL, params={"appid": api_key, "duplicated": "true"}, json=square
        ) as resp:
            resp.raise_for_status()
            polygon = await resp.json()
        polygon_id = polygon.get("id")

        cache[zone_key] = polygon_id
        _save_polygon_cache(cache)
        return polygon_id

    async def _fetch_ndvi(self, polygon_id: str, api_key: str) -> Optional[float]:
        end = int(time.time())
        start = end - 90 * 24 * 3600  # last 90 days, satellite revisit is slow

        async with self.session.get(
            self.NDVI_URL,
            params={"polyid": polygon_id, "start": start, "end": end, "appid": api_key},
        ) as resp:
            if resp.status == 404:
                # A just-registered (or not-yet-indexed) polygon genuinely
                # has no NDVI history yet -- this is an honest "no data
                # available", not an error to crash the ingest over.
                # cleaning.py's regional-default/last-known-value fallback
                # handles the gap the same way it handles any other
                # missing field (e.g. river_level_m).
                return None
            resp.raise_for_status()
            history = await resp.json()

        if not history:
            return None
        latest = max(history, key=lambda h: h.get("dt", 0))
        return latest.get("data", {}).get("mean")
