"""Supabase implementation of the slow-changing GIS field store."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from data_pipeline.static_datasets.store import StaticField
from data_pipeline.supabase_store import SupabaseHazardReadingStore


class SupabaseStaticDatasetStore:
    def __init__(self) -> None:
        self.client = SupabaseHazardReadingStore()

    def upsert(self, zone_id: str, field_name: str, value: Optional[float], source: str) -> None:
        self.client._ensure_zone(zone_id)
        self.client._request("POST", "StaticZoneField", {"on_conflict": "zoneId,fieldName"}, {
            "id": self.client._id(), "zoneId": zone_id, "fieldName": field_name, "value": value, "source": source,
            "ingestedAt": datetime.now(timezone.utc).isoformat(),
        }, "resolution=merge-duplicates,return=representation")

    def get(self, zone_id: str, field_name: str) -> Optional[StaticField]:
        rows = self.client._request("GET", "StaticZoneField", {"zoneId": f"eq.{zone_id}", "fieldName": f"eq.{field_name}", "limit": "1"})
        if not rows:
            return None
        row = rows[0]
        return StaticField(zone_id=row["zoneId"], field_name=row["fieldName"], value=row["value"], source=row["source"],
            ingested_at=datetime.fromisoformat(row["ingestedAt"].replace("Z", "+00:00")))

    def get_all_for_zone(self, zone_id: str) -> dict[str, float]:
        rows = self.client._request("GET", "StaticZoneField", {"zoneId": f"eq.{zone_id}"})
        return {row["fieldName"]: row["value"] for row in rows if row["value"] is not None}

    def needs_refresh(self, zone_id: str, field_name: str, max_age_days: float) -> bool:
        field = self.get(zone_id, field_name)
        return field is None or field.value is None or (datetime.now(timezone.utc) - field.ingested_at).total_seconds() > max_age_days * 86400
