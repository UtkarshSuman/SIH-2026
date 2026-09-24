"""
app/rag/seed_documents.py — Pre-load project documentation into ChromaDB.

Run this ONCE after setting up the RAG system to give the chatbot baseline
knowledge about Rescue Arc, hazard methodology, and the database schema.
It reads actual project files (README, WEIGHT_JUSTIFICATION.md, etc.)
so the chatbot can answer conceptual questions from real documentation.

Usage:
  cd backend2/backend
  python -m app.rag.seed_documents

Safe to re-run: checks if document title already exists before ingesting.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a script from backend2/backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.rag.retriever import ingest_text
from app.rag.models import RagDocumentLog, SessionLocal, ensure_table


def _already_ingested(title: str) -> bool:
    """Return True if this title is already logged (skip duplicate ingest)."""
    if SessionLocal is None:
        return False
    db = SessionLocal()
    try:
        return db.query(RagDocumentLog).filter(RagDocumentLog.title == title).first() is not None
    finally:
        db.close()


def _log(title: str, chunk_count: int, source_type: str = "file") -> None:
    if SessionLocal is None:
        return
    ensure_table()
    db = SessionLocal()
    try:
        db.add(RagDocumentLog(title=title, source_type=source_type, chunk_count=chunk_count))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def seed_file(path: Path, title: str) -> None:
    if not path.exists():
        print(f"  SKIP (not found): {path}")
        return
    if _already_ingested(title):
        print(f"  SKIP (already ingested): {title}")
        return
    text = path.read_text(encoding="utf-8", errors="replace")
    n = ingest_text(text, metadata={"title": title, "sourceType": "file"})
    _log(title, n)
    print(f"  ✓ {title}: {n} chunks")


def seed_inline(title: str, content: str) -> None:
    if _already_ingested(title):
        print(f"  SKIP (already ingested): {title}")
        return
    n = ingest_text(content, metadata={"title": title, "sourceType": "text"})
    _log(title, n, source_type="text")
    print(f"  ✓ {title}: {n} chunks")


def main():
    print("Seeding Rescue Arc documents into ChromaDB...\n")

    # Paths relative to this file's location (backend2/backend/app/rag/)
    base = Path(__file__).resolve().parents[3]  # → backend2/

    # Project-level docs
    seed_file(base / "README.md",                     "Rescue Arc — Project Overview")
    seed_file(base / "backend" / "README.md",         "Backend2 README")

    # GIS-Scripts-FETCH-API-layer docs
    gis_layer = base / "backend" / "GIS-Scripts-FETCH-API-layer"
    seed_file(gis_layer / "README.md",                "GIS-Scripts README")
    seed_file(gis_layer / "docs" / "WEIGHT_JUSTIFICATION.md", "AHP Weight Justification")
    seed_file(gis_layer / "docs" / "CHANGELOG.md",    "Project Changelog")
    seed_file(gis_layer / "hazard_platform" / "README.md",    "Hazard Platform README")
    seed_file(gis_layer / "hazard_platform" / "STATIC_DATASETS.md",  "Static Datasets Guide")
    seed_file(gis_layer / "hazard_platform" / "SESSIONS_README.md",  "Sessions & History README")
    seed_file(gis_layer / "gis_fetcher" / "README.md", "GIS Fetcher README")

    # Test & usage guide
    seed_file(base / "testreadme.md",                 "Testing & Running Guide")
    seed_file(base / "backend" / "app" / "rag" / "ragreadme.md", "RAG System Build Plan")

    # Inline: DB schema description
    seed_inline(
        "Rescue Arc Database Schema",
        """
# Rescue Arc PostgreSQL Database Schema

## habitations table
Stores all 2,607 habitations (villages/settlements) across 10 disaster-prone regions.

Columns:
- id: unique identifier
- name: habitation/village name
- region_id: foreign key to regions table
- geom: PostGIS geography point (latitude/longitude)
- zone_class: 'red' (high risk), 'yellow' (moderate risk), 'green' (safe) or NULL
- hazard_prob: model-predicted hazard probability (0.0 to 1.0)
- evacuees: estimated number of people to evacuate
- timeline: urgency timeline for evacuation (e.g. 'Immediate', '3 months')
- slope_class: terrain slope classification (1=gentle, 2=moderate, 3=steep)
- rainfall_mm: seasonal rainfall in mm
- discharge_cumecs: river discharge in cumecs (cubic meters/second)
- dist_river_m: distance from nearest river in meters
- isolation_index: isolation/accessibility score
- dest_id: FK to another habitation row used as the relocation destination

## regions table
Stores the 10 disaster-prone monitoring regions across India.

Columns:
- region_id: unique identifier
- display_name: full name (e.g. 'Wayanad, Kerala')
- slug: URL-friendly name (e.g. 'wayanad')
- hazard_types: array of monitored hazard types (e.g. ['LANDSLIDE', 'FLOOD'])

## Regions covered
Joshimath (Uttarakhand), Wayanad (Kerala), Idukki (Kerala), Nilgiris (Tamil Nadu),
Darjeeling (West Bengal), Dhemaji-Lakhimpur (Assam), Kandhamal-Rayagada (Odisha),
Puri coastal (Odisha), Kutch (Gujarat), Himachal-Uttarakhand Himalaya
        """
    )

    # Inline: Zone classification explanation
    seed_inline(
        "Rescue Arc Zone Classification System",
        """
# Zone Classification in Rescue Arc

## Three-tier Risk System

### 🔴 Red Zone (Critical Risk)
- Hazard probability > threshold determined by Random Forest model
- Requires IMMEDIATE evacuation planning
- SOPs followed: IMD 2020, BIS IS 14496-2, CWC 2018
- 762 habitations classified as Red Zone across 10 regions
- Matched against destination carrying capacity (45 m²/person Sphere standard)

### 🟡 Yellow Zone (Elevated Risk)  
- Moderate hazard probability — monitoring required
- Conditional evacuation may be needed if hazard escalates
- 1,154 habitations classified as Yellow Zone

### 🟢 Green / Safe Zone
- Low hazard probability
- Can serve as relocation destination for red/yellow zones
- 691 habitations identified as viable relocation destinations
- Total carrying capacity: 5,000,982 persons

## Scoring Model
- Algorithm: Calibrated Random Forest (100% recall on critical villages, ROC-AUC 0.996-1.000)
- Validation: Spatial GroupKFold cross-validation
- Benchmarked against official NDRF/IMD SOPs
- Features: slope class, rainfall, discharge, isolation index, soil, population
        """
    )

    print("\nSeed complete!")


if __name__ == "__main__":
    main()
