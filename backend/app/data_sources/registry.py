"""
FEATURE: Maps each hazard type to its list of candidate data sources.
Add a new source here (after implementing HazardDataSource) to add
redundancy for an existing hazard type, or a new hazard_type key entirely
for a new hazard category.
INSTALLATION: none.
"""
import logging
from app.data_sources.base import HazardDataSource
from app.data_sources.flood.open_meteo_source import OpenMeteoFloodSource

logger = logging.getLogger(__name__)

def _build_landslide_sources() -> list[HazardDataSource]:
    try:
        from app.data_sources.landslide.real_source import LandslideDataSource
        return [LandslideDataSource()]
    except Exception:
        logger.exception(
            "Landslide data source failed to initialize (likely missing terrain "
            "cache - run `python -m app.data_sources.landslide.terrain_cache`). "
            "Landslide predictions disabled until this is fixed; other hazard "
            "types and the rest of the app remain unaffected."
        )
        return []

HAZARD_SOURCES: dict[str, list[HazardDataSource]] = {
    "flood": [OpenMeteoFloodSource()],
    "landslide": _build_landslide_sources(),
}