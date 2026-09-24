"""
app/gis/database.py — Compatibility shim.

The original rag/models.py imported Base, SessionLocal, and engine from here.
Those are now in app/rag/models.py directly.  This file re-exports them so
any other code that references app.gis.database still works.
"""
from app.rag.models import Base, SessionLocal, _engine as engine

__all__ = ["Base", "SessionLocal", "engine"]
