"""
FEATURE: Maps each hazard type to its list of candidate data sources.
Add a new source here (after implementing HazardDataSource) to add
redundancy for an existing hazard type, or a new hazard_type key entirely
for a new hazard category.
INSTALLATION: none.
"""
from app.data_sources.base import HazardDataSource
from app.data_sources.flood.open_meteo_source import OpenMeteoFloodSource
from app.data_sources.landslide.placeholder_source import PlaceholderLandslideSource

HAZARD_SOURCES: dict[str, list[HazardDataSource]] = {
    "flood": [OpenMeteoFloodSource()],
    "landslide": [PlaceholderLandslideSource()],
    # "your_new_hazard": [SourceA(), SourceB()],  # race SourceA vs SourceB
}