"""
FEATURE: PLACEHOLDER landslide data source - no obvious free, no-key
landslide-specific public API exists yet, so this returns mock data so
the pipeline runs end-to-end for testing. REPLACE with a real source
(e.g. a government geological survey API, or derive risk from rainfall
intensity via Open-Meteo's weather API as a proxy) before relying on
real predictions.
INSTALLATION: none.
"""
import random
from app.data_sources.base import HazardDataSource


class PlaceholderLandslideSource(HazardDataSource):
    name = "placeholder_landslide"
    hazard_type = "landslide"

    async def fetch(self, zones: list[dict]) -> dict:
        # TODO: replace with a real API call
        return {zone["slug"]: {"mock": True} for zone in zones}

    def transform(self, raw: dict, zones: list[dict]) -> dict[str, dict]:
        # TODO: replace with real feature extraction from a real response
        return {zone["slug"]: {"rainfall_mm": random.uniform(0, 50)} for zone in zones}