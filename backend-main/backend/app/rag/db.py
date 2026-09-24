"""
app/rag/db.py — Thin psycopg2 helper reusing the project's existing .env
DB_URL.  All RAG tools import `get_pg_connection` from here — no ORM,
no new schema, no migrations; we query the existing PostGIS tables directly.
"""
from __future__ import annotations

import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Mirror backend/database.py's env-loading logic so this works whether you
# run uvicorn from backend/ or from backend2/.
_here = Path(__file__).resolve()
for _candidate in [
    _here.parents[3] / ".env",          # backend2/.env
    _here.parents[3] / ".env.local",
    _here.parents[4] / ".env",          # sih-main/.env
]:
    if _candidate.exists():
        load_dotenv(_candidate, override=False)


def get_pg_connection():
    """Return a new psycopg2 connection.  Caller is responsible for closing it."""
    url = os.getenv("DB_URL") or os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "No database URL found. Set DB_URL or DATABASE_URL in your .env file."
        )
    return psycopg2.connect(
        url,
        connect_timeout=8,
        sslmode=os.getenv("DB_SSLMODE", "require"),
    )
