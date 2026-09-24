# Testing Guide for Rescue Arc GIS & Hazard Platform (`testreadme.md`)

This guide outlines step-by-step instructions for running unit tests, executing pipeline dry-runs, running live data ingestion, launching the FastAPI backend API, and inspecting the Leaflet ops dashboard.

---

## Step 1: Run Automated Unit & Integration Tests

Verify that both the data acquisition package (`gis_fetcher`) and the scoring engine (`hazard_platform`) pass all unit tests.

```powershell
# Navigate to the GIS-Scripts-FETCH-API-layer root
cd c:\Users\utkar\SIH\sih-main\backend2\backend\GIS-Scripts-FETCH-API-layer

# 1. Test the GIS Data Acquisition Package (13 tests)
cd gis_fetcher
pytest

# 2. Test the Scoring Engine & AHP Matrix Solver (23 tests)
cd ..\hazard_platform
pytest
```

* **What to verify**: All **36 tests** should pass (`13 passed` in `gis_fetcher` and `23 passed` in `hazard_platform`).

---

## Step 2: Offline Pipeline Dry-Run (`example_run.py`)

Test the normalization, cleaning, scoring, zone color classification, and relocation prioritization logic using sample data **without making network API calls**.

```powershell
cd c:\Users\utkar\SIH\sih-main\backend2\backend\GIS-Scripts-FETCH-API-layer\hazard_platform
python example_run.py
```

### Data Flow & Architecture
1. **Sample Parameters** $\rightarrow$ `normalize.py` (standardizes raw field names)
2. **Normalized Fields** $\rightarrow$ `cleaning.py` (imputes missing values & flags anomalies)
3. **Cleaned Fields** $\rightarrow$ `predictor.py` (scores FLOOD, LANDSLIDE, EROSION, CLOUDBURST via AHP weights)
4. **Hazard Scores** $\rightarrow$ `zone_classifier.py` (assigns Red / Yellow / Green zone color)
5. **Zone Color + Vulnerability** $\rightarrow$ `prioritization.py` (calculates relocation urgency: `IMMEDIATE`, `SHORT_TERM`, `MEDIUM_TERM`)

* **What to verify**: Console output displaying cleaned parameters, individual hazard scores (e.g., FLOOD `0.670`), Zone Color (`YELLOW`), and Relocation Priority (`SHORT_TERM`).

---

## Step 3: Run End-to-End Live Ingestion CLI (`pipeline_runner.py`)

Run a live network data fetch for a pre-configured zone (e.g., Patna zone `Z-BIHAR-PATNA-01`).

```powershell
cd c:\Users\utkar\SIH\sih-main\backend2\backend\GIS-Scripts-FETCH-API-layer\hazard_platform
python pipeline_runner.py Z-BIHAR-PATNA-01
```

### Data Flow
1. **Live Fetch**: `gis_fetcher.hazard_map.fetch_for_hazard()` makes live API calls to Open-Meteo, SoilGrids, GloFAS, Overpass, etc.
2. **Normalize & Clean**: Formats raw API responses into locked hazard schema names and imputes missing fields.
3. **Static Auto-Refresh**: Auto-fetches historical counts & sediment type into `static_zone_data.db`.
4. **Persistence**: Writes `HazardReading` objects to the SQLite database (`hazard_readings.db`).

* **What to verify**: Console logs displaying provider status (`ok`), cleaned parameters, imputed fields, and `Saved to hazard_readings.db`.

---

## Step 4: Launch the FastAPI Backend API Server

Start the REST API backend server to serve pre-computed zone statuses and live point calculations.

```powershell
cd c:\Users\utkar\SIH\sih-main\backend2\backend\GIS-Scripts-FETCH-API-layer\hazard_platform
uvicorn backend.api:app --reload --port 8000
```

Open your browser or run HTTP queries against these endpoints:

1. **Pre-computed Zone Status** (reads stored result from Step 3):  
   [http://127.0.0.1:8000/api/zone-status/Z-BIHAR-PATNA-01](http://127.0.0.1:8000/api/zone-status/Z-BIHAR-PATNA-01)  
   * **Returns**: Stored zone color, worst hazard, hazard score breakdown, and relocation priority.

2. **Live Point Analysis** ("Click anywhere on map"):  
   [http://127.0.0.1:8000/api/analyze-point?lat=25.594&lon=85.137](http://127.0.0.1:8000/api/analyze-point?lat=25.594&lon=85.137)  
   * **Returns**: On-the-fly derived zone bounding box, live-fetched data, hazard scores, and priority.

3. **Raw GIS Data Dump**:  
   [http://127.0.0.1:8000/api/place-data?lat=25.594&lon=85.137](http://127.0.0.1:8000/api/place-data?lat=25.594&lon=85.137)  
   * **Returns**: Raw GeoJSON features directly from Open-Meteo, OpenStreetMap, and elevation endpoints.

---

## Step 5: Test the Interactive Map Operations Dashboard

1. Ensure the `uvicorn backend.api:app` server is active (running on port 8000 from Step 4).
2. Open `hazard_platform/frontend/dashboard.html` directly in your browser.
3. Click any location on the interactive Leaflet map:
   * The frontend sends a request to `GET /api/analyze-point?lat=...&lon=...`.
   * A colored hazard marker (`RED`, `YELLOW`, or `GREEN`) drops on the clicked coordinate, and the sidebar displays real-time hazard breakdown and relocation urgency.
