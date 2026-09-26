import importlib.util
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

for p in [
    ROOT_DIR,
    BASE_DIR,
    BASE_DIR / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert",
    BASE_DIR / "GIS-Scripts-FETCH-API-layer" / "hazard_platform",
]:
    p_str = str(p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)

root_main_file = ROOT_DIR / "main.py"
spec = importlib.util.spec_from_file_location("root_main", root_main_file)
root_main = importlib.util.module_from_spec(spec)
sys.modules["root_main"] = root_main
spec.loader.exec_module(root_main)

app = root_main.app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)