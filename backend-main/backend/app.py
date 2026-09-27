"""Compatibility entrypoint for hosts configured with backend.app:app or backend.main:app."""

import importlib.util
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

for p in [
    ROOT_DIR,
    BASE_DIR,
    BASE_DIR / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert",
    BASE_DIR / "GIS-Scripts-FETCH-API-layer" / "gis_fetcher",
    BASE_DIR / "GIS-Scripts-FETCH-API-layer" / "hazard_platform",
]:
    p_str = str(p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)

root_main_file = ROOT_DIR / "main.py"
if root_main_file.exists():
    spec = importlib.util.spec_from_file_location("backend_main_root", root_main_file)
    backend_main_root = importlib.util.module_from_spec(spec)
    sys.modules["backend_main_root"] = backend_main_root
    spec.loader.exec_module(backend_main_root)
    app = getattr(backend_main_root, "app", None)
else:
    import main as _m
    app = getattr(_m, "app", None)

__all__ = ["app"]
