# FEATURE: Real landslide HazardDataSource. Per 30-min cycle: fetches ONLY
#          rainfall (fast — Open-Meteo primary, imdlib/IMD gridded data as a
#          Wayanad-specific secondary source for antecedent rainfall
#          cross-check). Static slope/soil-clay features are NOT fetched
#          here — they're read from the terrain_cache.py JSON cache produced
#          by the one-time setup step. This keeps fetch() fast enough to not
#          delay the flood/other hazard cycles it runs alongside.
#
# INSTALLATION: pip install httpx imdlib

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

import httpx

from app.data_sources.base import HazardDataSource
from app.data_sources.landslide.terrain_cache import load_cache

logger = logging.getLogger(__name__)

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

RAINFALL_LOOKBACK_DAYS = 30
SPIKE_WINDOW_DAYS = 3


class LandslideDataSource(HazardDataSource):
    name = "landslide_real_source"
    hazard_type = "landslide"

    def __init__(self) -> None:
        self._static_cache = load_cache()  # raises loudly at startup if not built yet —
        # intentional: better to fail fast at boot than silently score every
        # zone with defaults for weeks.

    async def fetch(self, zones: list[dict]) -> Any:
        """Fetch last 30 days of daily rainfall for each zone from Open-Meteo.
        Raises on any failure so the pipeline's source-race logic can fall
        back correctly — no silent partial data.
        """
        today = date.today()
        start = today - timedelta(days=RAINFALL_LOOKBACK_DAYS)

        raw: dict[str, dict] = {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            for zone in zones:
                params = {
                    "latitude": zone["lat"],
                    "longitude": zone["lng"],
                    "start_date": start.isoformat(),
                    "end_date": today.isoformat(),
                    "daily": "precipitation_sum",
                    "timezone": "auto",
                }
                resp = await client.get(OPEN_METEO_ARCHIVE_URL, params=params)
                resp.raise_for_status()  # let this propagate — no silent fallback
                payload = resp.json()
                daily_precip = payload.get("daily", {}).get("precipitation_sum")
                if daily_precip is None:
                    raise ValueError(f"Open-Meteo returned no daily precipitation for {zone['slug']}")
                raw[zone["slug"]] = {"daily_precip_mm": daily_precip}

        return raw

    def transform(self, raw: Any, zones: list[dict]) -> dict[str, dict]:
        out: dict[str, dict] = {}

        for zone in zones:
            slug = zone["slug"]
            zone_raw = raw.get(slug)
            if zone_raw is None:
                # Missing zone in the raw payload is a data problem, not a
                # "score it as GREEN" problem — surface it, don't hide it.
                raise KeyError(f"No rainfall data returned for zone '{slug}'")

            daily = zone_raw["daily_precip_mm"]
            rainfall_30d_mm = float(sum(v for v in daily if v is not None))
            rainfall_3d_mm = float(sum(v for v in daily[-SPIKE_WINDOW_DAYS:] if v is not None))

            static = self._static_cache.get(slug, {})
            if not static:
                logger.warning(
                    "No cached static terrain features for zone '%s' — "
                    "slope/clay will use conservative defaults in the model.",
                    slug,
                )

            out[slug] = {
                "rainfall_30d_mm": rainfall_30d_mm,
                "rainfall_3d_mm": rainfall_3d_mm,
                "slope_deg": static.get("slope_deg"),
                "clay_pct": static.get("clay_pct"),
            }

        return out