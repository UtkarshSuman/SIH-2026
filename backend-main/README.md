# Rescue Arc — SIH26191

**Smart India Hackathon 2026 · MHA/NDRF Disaster Management Theme**

Rescue Arc is a GIS/DEM-based hazard-zone prediction and relocation decision-support system. It identifies high-risk habitations (villages/settlements) across disaster-prone regions of India, classifies them into hazard tiers, and generates data-driven relocation plans matched against the carrying capacity of nearby safe zones.

---

## What It Does

- **Predicts hazard zones** — classifies ~2,600 habitations across 10 disaster-prone regions into Red / Yellow / Safe tiers using a calibrated Random Forest model (100% recall on critical villages, ROC-AUC 0.996–1.000).
- **Plans relocation** — matches red-zone habitations to viable destination sites based on Sphere-standard carrying capacity (45 m²/person).
- **Benchmarks against official SOPs** — cross-validates rule-based hazard tiers against IMD 2020 SOP, BIS IS 14496-2, and CWC 2018 SOP.
- **Visualizes on a live dashboard** — Leaflet-based ops dashboard with satellite basemap, per-region hazard widgets, and a printable NDRF briefing generator ("Form 201").
- **Sends alerts** — Firebase push notifications for at-risk habitations.
- **Serves data via API** — FastAPI + PostGIS backend for spatial queries (nearest safe haven, per-region GeoJSON export).

---

## Regions Covered

Joshimath (Uttarakhand) · Wayanad (Kerala) · Idukki (Kerala) · Nilgiris (Tamil Nadu) · Darjeeling (West Bengal) · Dhemaji–Lakhimpur (Assam) · Kandhamal–Rayagada (Odisha) · Puri coastal (Odisha) · Kutch (Gujarat) · Himachal–Uttarakhand Himalaya

---

## Tech Stack

| Layer | Tools |
|---|---|
| GIS processing | Python, rasterio, GeoPandas, GDAL, rasterstats |
| Database | PostgreSQL + PostGIS |
| Backend API | FastAPI |
| Frontend | React (dark-emerald "Rescue Arc" theme) |
| Dashboard | Leaflet (self-contained HTML SPA) |
| Alerts | Firebase Cloud Messaging |
| Deployment (planned) | Render/Railway (backend + DB), Vercel/Netlify (frontend) |

---

## Pipeline Overview

1. **Data Integration** → `combined_master.csv` (2,607 habitations × 28 columns)
2. **Cleaning & Feature Engineering** → `combined_cleaned.csv` (slope class, road access, isolation index, hydraulic shock)
3. **Exploratory Data Analysis**
4. **Hazard Model Training** → calibrated Random Forest, spatial GroupKFold validation
5. **Relocation Assessment** → `relocation_action_plan.csv` + `destination_carrying_capacity.csv` (691 candidate sites)
6. **SOP Benchmarking** → `benchmark_classified_villages.csv`

### Result counts
- **762** red-zone habitations
- **1,154** yellow-zone habitations
- **691** safe/destination-viable habitations
- Total destination carrying capacity: **5,000,982** persons

---

## Database Schema

Single PostgreSQL database (`rescue_arc`) with the PostGIS extension enabled.

- **`regions`** — `region_id`, `display_name`, `hazard_types[]`
- **`habitations`** — `id`, `name`, `region_id`, `geography(Point, 4326) geom`, `zone_class`, `hazard_prob`, `evacuees`, `timeline`, `slope_class`, `rainfall_mm`, `discharge_cumecs`, `dist_river_m`, `isolation_index`, `dest_id` (self-referential FK to another `habitations` row — destinations are safe-zone habitations, not a separate table)
  - GIST index on `geom`
  - `dist_km` between a habitation and its assigned destination is computed live via `ST_Distance` inside the `get_habitations_geojson()` function — not a stored column

Deployed on Render PostgreSQL (Oregon, free tier) so both frontend/DB and backend developers can connect to one shared instance.

---

## API

FastAPI backend (`main.py`, `database.py`, `routers/habitations.py`):

```
GET /api/habitations?region=<slug>
```
Resolves a region slug to `region_id`, calls the `get_habitations_geojson()` Postgres function, and returns a GeoJSON `FeatureCollection` stamped with the region slug.

---

## Project Structure

```
Alert-system/       Firebase push notification service
backend/             FastAPI app, routers, migrations, subscriber UI
dashboard/           GIS_Dashboard.html (Leaflet ops dashboard)
db-loaders/          Scripts to load CSV/GPKG data into PostGIS
scripts/             Data pipeline: fetch, clean, model, zonal stats
GIS model/           QGIS project file
```

---

## Setup

1. Install PostgreSQL + enable the PostGIS extension.
2. Create the schema (`regions`, `habitations` tables with GIST index on `geom`).
3. Load data:
   ```cmd
   python db-loaders/load_habitations.py
   ```
4. Set `DB_URL` in a `.env` file (never commit this — already git-ignored).
5. Run the backend:
   ```cmd
   pip install -r backend/requirements.txt
   uvicorn backend.main:app --reload
   ```
6. Open `dashboard/GIS_Dashboard.html` in a browser (or serve it) to view the live map.

---

## Security Notes

- `.env` and `firebase-service-account.json` are git-ignored — verify with `git check-ignore` before every commit.
- Rotate any credential (DB password, Firebase service account key) immediately if it is ever pasted into chat, a screenshot, or committed by mistake.

---

## Status / Next Steps

- [x] Data pipeline (stages 1–6) complete
- [x] Hazard model trained and validated
- [x] Relocation plan generated
- [x] PostGIS schema live on Render, data loaded (2,607 rows)
- [x] First FastAPI endpoint (`/api/habitations`) built and reviewed
- [x] Repo pushed to GitHub
- [ ] Replace dashboard's embedded static habitation array with a live `fetch()` call to the API
- [ ] Bulk `COPY`-based data loader (`load_habitations_bulk.py`) — written, not yet run
- [ ] Twilio SMS alert wiring
- [ ] Frontend ↔ dashboard integration
- [ ] Scheduled ingestion job for updating habitation data without a full dashboard regen

---

## Repository

[github.com/madhvendra1027/rescue-arc](https://github.com/madhvendra1027/rescue-arc)
