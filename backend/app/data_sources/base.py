"""
FEATURE: The contract every hazard data source implements - whichever
source for a given hazard type responds first (see hazard/pipeline.py)
is the one used for that cycle. Your teammate adds a real API by
implementing this interface and registering it in registry.py - nothing
else in the pipeline changes.
INSTALLATION: none.
"""
from abc import ABC, abstractmethod
from typing import Any


class HazardDataSource(ABC):
    name: str
    hazard_type: str  # "flood" | "landslide"

    @abstractmethod
    async def fetch(self, zones: list[dict]) -> Any:
        """Fetch raw data for the given zones (each has slug, lat, lng).
        Raise an exception on failure - the pipeline will try the next
        source in the race."""
        raise NotImplementedError

    @abstractmethod
    def transform(self, raw: Any, zones: list[dict]) -> dict[str, dict]:
        """Convert raw API response into {zone_slug: {feature: value, ...}}
        - the normalized shape the hazard model expects."""
        raise NotImplementedError