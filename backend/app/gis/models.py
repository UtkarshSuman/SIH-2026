"""
FEATURE: SQLAlchemy models for zones and their hazard statuses.
  - Zone: a town/place (center point + radius, using real PostGIS geometry)
  - ZoneStatus: CURRENT status per (zone, hazard_type) - one row each,
    upserted on every pipeline run (this is what keeps old data from
    piling up - see chat explanation)
  - ZoneStatusHistory: append-only log per (zone, hazard_type, run) - used
    for escalation detection and trend display, auto-cleaned after 24h
INSTALLATION: pip install sqlalchemy geoalchemy2
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, ForeignKey, UniqueConstraint
from geoalchemy2 import Geometry
from app.gis.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Zone(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    center = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    radius_meters = Column(Integer, default=5000)
    population = Column(Integer, nullable=True)  # NEW - drives relocation planning
    created_at = Column(DateTime, default=datetime.utcnow)


class RelocationSite(Base):
    """Candidate relocation sites with accommodation capacity - separate
    from Zone since these are vetted destination sites, not existing
    towns."""
    __tablename__ = "relocation_sites"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    center = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ZoneStatus(Base):
    """Current status - exactly one row per (zone, hazard_type). Upserted,
    never accumulated, so this table stays small regardless of how many
    refresh cycles have run."""
    __tablename__ = "zone_status"

    id = Column(String, primary_key=True, default=_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    hazard_type = Column(String, nullable=False)  # "flood" | "landslide"
    status = Column(String, nullable=False)         # "GREEN" | "YELLOW" | "RED"
    risk_score = Column(Float, nullable=False)
    raw_output = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("zone_id", "hazard_type", name="uq_zone_hazard"),)


class ZoneStatusHistory(Base):
    """Append-only log - used to detect escalations (compare newest vs
    previous) and for trend display. Cleaned up after 24h by the pipeline."""
    __tablename__ = "zone_status_history"

    id = Column(String, primary_key=True, default=_uuid)
    zone_id = Column(String, nullable=False)
    hazard_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)