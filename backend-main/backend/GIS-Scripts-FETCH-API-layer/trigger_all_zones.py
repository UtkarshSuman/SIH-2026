"""trigger_all_zones.py — Manually trigger full live GIS fetching, ML inference,
and database updates for all registered zones in the system.
"""
import asyncio
import os
import sys
import time
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "gis_fetcher"))
sys.path.insert(0, str(ROOT_DIR / "hazard_platform"))
sys.path.insert(0, str(ROOT_DIR / "rescue_arc_alert"))
os.chdir(str(ROOT_DIR / "hazard_platform"))

from test_full_integrated_pipeline import run_full_integration_test
from zones import list_zones


async def run_batch_update() -> list[dict]:
    zones = list_zones()
    results = []
    for zone in zones:
        try:
            res = await run_full_integration_test(zone.zone_id)
            results.append({
                "zone_id": zone.zone_id,
                "name": zone.name,
                "status": "SUCCESS",
                "color": res.get("zone_color") if isinstance(res, dict) else "GREEN",
                "worst_hazard": res.get("worst_hazard") if isinstance(res, dict) else "FLOOD",
                "priority": res.get("priority") if isinstance(res, dict) else "NONE",
                "priority_score": res.get("priority_score") if isinstance(res, dict) else 0.0,
            })
        except Exception as exc:
            results.append({
                "zone_id": zone.zone_id,
                "name": zone.name,
                "status": "ERROR",
                "error": str(exc),
            })
    return results


async def main():
    zones = list_zones()
    print(f"\n=======================================================")
    print(f"  TRIGGERING LIVE GIS & ML UPGRADATION FOR {len(zones)} ZONES")
    print(f"=======================================================\n")
    
    results = await run_batch_update()

    print("\n" + "=" * 65)
    print("                 SUMMARY OF BATCH UPGRADATION")
    print("=" * 65)
    for r in results:
        status_text = r.get("status")
        if status_text == "SUCCESS":
            detail = f"{r.get('color')} [{r.get('worst_hazard')}]"
        else:
            detail = r.get("error", "ERR")
        print(f"  • {r.get('zone_id', ''):<28} | {r.get('name', ''):<22} | {detail}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(main())

