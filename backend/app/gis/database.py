"""
FEATURE: SQLAlchemy engine/session for the GIS tables (zones, zone_status,
zone_status_history) - deliberately separate from Prisma. Both connect to
the SAME Supabase Postgres database, just via different ORMs, since
Prisma doesn't support PostGIS geometry types well.
INSTALLATION: pip install sqlalchemy psycopg2-binary geoalchemy2
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()