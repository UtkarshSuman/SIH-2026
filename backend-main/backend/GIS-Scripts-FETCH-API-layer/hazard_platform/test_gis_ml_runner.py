import asyncio
import json
import os
import sys
import time
from pathlib import Path

# Fix stdout encoding for Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(r"c:\Users\utkar\SIH\sih-main\backend-main\backend\GIS-Scripts-FETCH-API-layer")
sys.path.insert(0, str(ROOT_DIR / "gis_fetcher"))
sys.path.insert(0, str(ROOT_DIR / "hazard_platform"))
sys.path.insert(0, str(ROOT_DIR / "rescue_arc_alert"))

os.chdir(str(ROOT_DIR / "hazard_platform"))

from data_pipeline.cleaning import ZoneHistory
from data_pipeline.hazard_reading_store import HazardReadingStore
from data_pipeline.static_datasets.store import StaticDatasetStore
from data_pipeline.models import HazardType
from pipeline_runner import ingest_zone, seed_history_from_store
from backend.api import _score_zone
from zones import get_zone

def run_test(zone_id: str = "Z-ODISHA-PURI-01"):
    print(f"=== TESTING LIVE GIS DATA INGESTION & ML MODEL FOR ZONE: {zone_id} ===")
    zone = get_zone(zone_id)
    print(f"Zone Name: {zone.name}")
    print(f"Zone Bounding Box: [{zone.min_lon}, {zone.min_lat}, {zone.max_lon}, {zone.max_lat}]")
    print(f"Center: {zone.center}")

    db_path = str(ROOT_DIR / "hazard_platform" / "hazard_readings.db")
    static_db_path = str(ROOT_DIR / "hazard_platform" / "static_zone_data.db")

    store = HazardReadingStore(db_path=db_path)
    static_store = StaticDatasetStore(db_path=static_db_path)
    history = ZoneHistory()
    seed_history_from_store(zone_id, store, history)

    print("\n--- 1. FETCHING LIVE GIS DATA VIA PROVIDERS ---")
    t0 = time.time()
    summary = ingest_zone(
        zone_id,
        store,
        history,
        static_store=static_store,
        auto_refresh_static=False
    )
    t_gis = time.time() - t0
    print(f"Live GIS Fetching completed in {t_gis:.2f}s\n")

    # Serialize GIS response
    gis_response = {}
    for hazard_name, details in summary.items():
        gis_response[hazard_name] = {
            "providers_called": details.get("providers_called", []),
            "provider_status": details.get("provider_status", {}),
            "imputed_fields": details.get("imputed_fields", []),
            "parameters": details.get("parameters", {})
        }

    print("--- 2. RUNNING ML HAZARD MODEL INFERENCE ---")
    t0 = time.time()
    classification, priority_res, oldest_ts = _score_zone(zone_id)
    t_ml = time.time() - t0
    print(f"ML Model Inference completed in {t_ml:.2f}s\n")

    ml_output = {
        "zone_color": classification.color.value,
        "worst_hazard": classification.worst_hazard.value,
        "hazard_scores": {h.value: round(s, 4) for h, s in classification.scores.items()},
        "priority_level": priority_res.priority.value,
        "priority_score": round(priority_res.priority_score, 4),
        "data_recorded_at": oldest_ts.isoformat() if oldest_ts else None,
    }

    result = {
        "status": "SUCCESS",
        "zone_info": {
            "zone_id": zone.zone_id,
            "name": zone.name,
            "center": {"lon": zone.center[0], "lat": zone.center[1]},
            "bbox": [zone.min_lon, zone.min_lat, zone.max_lon, zone.max_lat]
        },
        "gis_fetching_response": gis_response,
        "ml_model_output": ml_output
    }

    output_path = Path("test_output_result.json")
    output_path.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    print(f"Results written to {output_path.resolve()}")
    return result

if __name__ == "__main__":
    zone = sys.argv[1] if len(sys.argv) > 1 else "Z-ODISHA-PURI-01"
    run_test(zone)
