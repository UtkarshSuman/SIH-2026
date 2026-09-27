"""Backend App package initialization.
Exports the unified FastAPI app instance for compatibility with 'backend.app:app'.
"""

import importlib.util
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
_root_dir = _backend_dir.parent

for _p in [
    _root_dir,
    _backend_dir,
    _backend_dir / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert",
    _backend_dir / "GIS-Scripts-FETCH-API-layer" / "gis_fetcher",
    _backend_dir / "GIS-Scripts-FETCH-API-layer" / "hazard_platform",
]:
    _p_str = str(_p)
    if _p_str not in sys.path:
        sys.path.insert(0, _p_str)

_root_main_file = _root_dir / "main.py"
if _root_main_file.exists():
    _spec = importlib.util.spec_from_file_location("unified_backend_main", _root_main_file)
    _unified_mod = importlib.util.module_from_spec(_spec)
    sys.modules["unified_backend_main"] = _unified_mod
    _spec.loader.exec_module(_unified_mod)
    app = getattr(_unified_mod, "app", None)
else:
    import main as _m
    app = getattr(_m, "app", None)

__all__ = ["app"]
