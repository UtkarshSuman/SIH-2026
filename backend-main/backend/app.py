"""Compatibility entrypoint for hosts configured with backend.app:app."""

import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

__all__ = ["app"]
