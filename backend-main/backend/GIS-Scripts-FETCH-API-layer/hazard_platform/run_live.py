"""Scheduled entry point: refresh every registered zone and publish map-ready outputs."""
from __future__ import annotations

from data_pipeline.cleaning import ZoneHistory
from data_pipeline.store_factory import create_hazard_reading_store, create_static_dataset_store
from live_sync import publish_latest_assessment
from pipeline_runner import ingest_zone, seed_history_from_store
from zones import list_zones


def main() -> int:
    readings = create_hazard_reading_store()
    static_fields = create_static_dataset_store()
    history = ZoneHistory()
    for zone in list_zones():
        seed_history_from_store(zone.zone_id, readings, history)
        ingest_zone(zone.zone_id, readings, history, static_store=static_fields)
        published = publish_latest_assessment(zone.zone_id, readings)
        print(f"{zone.zone_id}: {'published to Supabase' if published else 'saved locally'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
