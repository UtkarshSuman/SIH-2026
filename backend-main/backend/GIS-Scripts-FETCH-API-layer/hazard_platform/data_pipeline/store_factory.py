"""Select Supabase in deployed environments and SQLite for explicit local development."""
from __future__ import annotations

from data_pipeline.hazard_reading_store import HazardReadingStore
from data_pipeline.supabase_store import SupabaseHazardReadingStore, using_supabase
from data_pipeline.static_datasets.store import StaticDatasetStore
from data_pipeline.supabase_static_store import SupabaseStaticDatasetStore


def create_hazard_reading_store(db_path: str = "hazard_readings.db"):
    import os
    from pathlib import Path
    if os.environ.get("HAZARD_STORE_BACKEND") != "supabase" and not os.environ.get("USE_SUPABASE_READINGS"):
        p = Path(db_path)
        if not p.is_absolute():
            p = Path(__file__).resolve().parents[1] / db_path
        return HazardReadingStore(str(p))
    if using_supabase():
        try:
            store = SupabaseHazardReadingStore()
            store._request("GET", "HazardReading", {"limit": "1"})
            return store
        except Exception:
            pass
    p = Path(db_path)
    if not p.is_absolute():
        p = Path(__file__).resolve().parents[1] / db_path
    return HazardReadingStore(str(p))


def create_static_dataset_store(db_path: str = "static_zone_data.db"):
    import os
    from pathlib import Path
    if os.environ.get("HAZARD_STORE_BACKEND") != "supabase" and not os.environ.get("USE_SUPABASE_READINGS"):
        p = Path(db_path)
        if not p.is_absolute():
            p = Path(__file__).resolve().parents[1] / db_path
        return StaticDatasetStore(str(p))
    if using_supabase():
        try:
            store = SupabaseStaticDatasetStore()
            return store
        except Exception:
            pass
    p = Path(db_path)
    if not p.is_absolute():
        p = Path(__file__).resolve().parents[1] / db_path
    return StaticDatasetStore(str(p))

