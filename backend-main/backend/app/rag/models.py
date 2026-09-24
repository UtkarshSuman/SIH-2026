"""
app/rag/models.py — SQLAlchemy model for the RAG document ingestion log.

Tracks which documents have been ingested into the vector store so the
admin dashboard can list them.  Uses the same Render PostgreSQL database
as the rest of the backend (habitations, regions tables) — just adds one
new table: rag_document_log.

The Base and engine are imported from app.rag.db_orm (a minimal SQLAlchemy
setup that mirrors the existing database.py connection string).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.rag.db import get_pg_connection
from app.core.config import settings
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env (same logic as db.py so this works standalone too)
for _candidate in [
    Path(__file__).resolve().parents[3] / ".env",
    Path(__file__).resolve().parents[4] / ".env",
]:
    if _candidate.exists():
        load_dotenv(_candidate, override=False)
        break

_db_url = os.getenv("DB_URL") or os.getenv("DATABASE_URL") or ""


class Base(DeclarativeBase):
    pass


def _get_sqlalchemy_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


# SQLAlchemy engine pointing at PostgreSQL (Supabase / Render / Cloud)
if _db_url:
    _engine = create_engine(
        _get_sqlalchemy_url(_db_url),
        pool_pre_ping=True,
        connect_args={"sslmode": os.getenv("DB_SSLMODE", "require"), "connect_timeout": 5},
    )
    SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
else:
    _engine = None
    SessionLocal = None


class RagDocumentLog(Base):
    __tablename__ = "rag_document_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    source_type = Column(String, nullable=False)   # "text" | "file"
    chunk_count = Column(Integer, nullable=False)
    ingested_at = Column(DateTime, default=datetime.utcnow)


def ensure_table() -> None:
    """Create rag_document_log if it doesn't exist yet (idempotent)."""
    if _engine is not None:
        Base.metadata.create_all(_engine)