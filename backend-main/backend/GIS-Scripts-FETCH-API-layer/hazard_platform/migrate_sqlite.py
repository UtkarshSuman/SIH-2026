"""One-time importer from the legacy GIS SQLite databases into Supabase."""
from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime
from pathlib import Path

from data_pipeline.models import DataQuality, HazardReading, HazardType
from data_pipeline.store_factory import create_hazard_reading_store, create_static_dataset_store
from data_pipeline.supabase_store import using_supabase


def migrate_readings(path: Path) -> int:
    if not path.exists():
        return 0
    destination = create_hazard_reading_store()
    count = 0
    with sqlite3.connect(path) as connection:
        for zone_id, hazard_type, source, recorded_at, parameters, data_quality in connection.execute(
            "SELECT zone_id, hazard_type, source, recorded_at, parameters, data_quality FROM hazard_readings"
        ):
            destination.save(HazardReading(zone_id=zone_id, hazard_type=HazardType(hazard_type), source=source,
                recorded_at=datetime.fromisoformat(recorded_at), parameters=json.loads(parameters), data_quality=DataQuality(data_quality)))
            count += 1
    return count


def migrate_static_fields(path: Path) -> int:
    if not path.exists():
        return 0
    destination = create_static_dataset_store()
    count = 0
    with sqlite3.connect(path) as connection:
        for zone_id, field_name, value, source in connection.execute(
            "SELECT zone_id, field_name, value, source FROM static_zone_fields"
        ):
            destination.upsert(zone_id, field_name, value, source)
            count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description="Import legacy GIS SQLite records into Supabase.")
    parser.add_argument("--readings-db", default="hazard_readings.db")
    parser.add_argument("--static-db", default="static_zone_data.db")
    args = parser.parse_args()
    if not using_supabase():
        parser.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for migration")
    readings = migrate_readings(Path(args.readings_db))
    static_fields = migrate_static_fields(Path(args.static_db))
    print(f"Imported {readings} telemetry readings and {static_fields} static GIS fields into Supabase.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
