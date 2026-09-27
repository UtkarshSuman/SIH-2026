"""
admin_boundary.py — Live administrative boundary polygons from OpenStreetMap (Nominatim).

Resolves real boundary polygons for Indian habitations, towns, tehsils, and districts.
Implements multi-stage fallback:
  1. Direct place search
  2. Administrative entity variations (Tehsil, District, Municipality)
  3. Coordinate reverse-geocoding at administrative zoom levels (10, 9, 8)
"""

from __future__ import annotations

import asyncio
from typing import Any, List
import httpx

from ..core.base import BBox, Feature, GISDataProvider
from ..core.registry import register_provider

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "RescueArc-DisasterRelocation/1.0 (GIS Disaster Management Platform)"


@register_provider("admin_boundary")
class NominatimBoundaryProvider(GISDataProvider):
    name = "admin_boundary"
    requires_api_key = False

    async def fetch(self, bbox: BBox, **params: Any) -> List[Feature]:
        place_name = params.get("place_name")
        admin_level = params.get("admin_level")
        center_lat = (bbox.min_lat + bbox.max_lat) / 2.0
        center_lon = (bbox.min_lon + bbox.max_lon) / 2.0

        headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        candidates: List[str] = []

        if place_name:
            clean = place_name.split(",")[0].strip()
            # Variation list for Indian administrative boundaries
            if "guwahati" in clean.lower():
                candidates = [
                    "Kamrup Metropolitan, Assam",
                    "Guwahati Municipal Corporation",
                    place_name,
                ]
            elif "puri" in clean.lower():
                candidates = [
                    "Puri District, Odisha",
                    "Puri Municipality, Odisha",
                    place_name,
                ]
            elif "joshimath" in clean.lower():
                candidates = [
                    "Joshimath Tehsil, Uttarakhand",
                    "Joshimath, Chamoli, Uttarakhand",
                    place_name,
                ]
            elif "wayanad" in clean.lower() or "meppadi" in clean.lower():
                candidates = [
                    "Wayanad, Kerala",
                    "Vythiri Taluk, Wayanad",
                    place_name,
                ]
            elif "patna" in clean.lower():
                candidates = [
                    "Patna, Bihar",
                    "Patna District, Bihar",
                    place_name,
                ]
            else:
                candidates = [
                    place_name,
                    f"{clean}, India",
                    f"{clean} Tehsil, India",
                    f"{clean} District, India",
                    f"{clean} Municipality, India",
                ]

        async with httpx.AsyncClient(headers=headers, timeout=12.0) as client:
            # Stage 1 & 2: Place & Administrative variations
            for query in candidates:
                try:
                    search_params = {
                        "q": query,
                        "format": "geojson",
                        "polygon_geojson": "1",
                        "countrycodes": "in",
                        "limit": "3",
                    }
                    if admin_level:
                        search_params["admin_level"] = str(admin_level)

                    resp = await client.get(NOMINATIM_SEARCH_URL, params=search_params)
                    if resp.status_code == 200:
                        data = resp.json()
                        feats = data.get("features", [])
                        for f in feats:
                            geom = f.get("geometry", {})
                            if geom.get("type") in ("Polygon", "MultiPolygon") and geom.get("coordinates"):
                                return [
                                    Feature(
                                        geometry=geom,
                                        properties=f.get("properties", {}),
                                        source="nominatim_osm",
                                    )
                                ]
                except Exception:
                    pass
                await asyncio.sleep(0.3)

            # Stage 3: Coordinate Reverse-geocoding fallback
            for zoom in (10, 9, 8):
                try:
                    rev_params = {
                        "lat": f"{center_lat:.6f}",
                        "lon": f"{center_lon:.6f}",
                        "format": "geojson",
                        "polygon_geojson": "1",
                        "zoom": str(zoom),
                    }
                    resp = await client.get(NOMINATIM_REVERSE_URL, params=rev_params)
                    if resp.status_code == 200:
                        data = resp.json()
                        feats = data.get("features", [])
                        for f in feats:
                            geom = f.get("geometry", {})
                            if geom.get("type") in ("Polygon", "MultiPolygon") and geom.get("coordinates"):
                                return [
                                    Feature(
                                        geometry=geom,
                                        properties=f.get("properties", {}),
                                        source="nominatim_osm_reverse",
                                    )
                                ]
                except Exception:
                    pass
                await asyncio.sleep(0.3)

        return []
