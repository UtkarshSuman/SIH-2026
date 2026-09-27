# Rescue-Arc · Hazard Classification & Zone Alert Broadcast Platform

*(Smart India Hackathon 2026 — Problem Statement 26191)*

An end-to-end disaster intelligence and emergency broadcast platform. Ingests live satellite and meteorological GIS feeds, scores risk using machine learning and AHP multi-criteria weighting, identifies **RED / YELLOW / GREEN** hazard zones (**Flood**, **Landslide**, **Coastal Erosion**, **Cloudburst**), and broadcasts geo-targeted **Firebase Web Push alerts** to citizens even when their browser is closed.

---

## System Architecture

The platform consists of three integrated, modular systems:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. GIS DATA INGESTION (gis_fetcher)                                     │
│    Open-Meteo Weather · USGS Elevation · GloFAS River · Sentinel Marine │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Live Raw Features
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. HAZARD PLATFORM & ML SCORING (hazard_platform)                      │
│    Data Normalization -> Moving-Window Cleaning -> HazardReadingStore │
│    ML Surrogate Models (RandomForest/GBM) -> AHP Multi-Hazard Weighting│
│    Zone Classification (RED/YELLOW/GREEN) -> Prioritization Engine    │
│    API: http://localhost:8000/api/zone-status/{zone_id}               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Scored Status & Risk Vectors
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. ALERT BROADCAST & ADMIN CONSOLE (rescue_arc_alert)                  │
│    Supabase Postgres (Append-only history, zone status view, RLS)      │
│    Transition Detection: GREEN -> YELLOW (Warning), RED (Emergency)    │
│    W3C Web Push / Firebase Cloud Messaging (FCM) -> Citizen Devices   │
│    Admin Dashboard & Scenario Simulator: http://localhost:8001/admin  │
│    Subscriber Notification Center: http://localhost:8001/test          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
.
├── gis_fetcher/                      # GIS & meteorological ingestion package
│   ├── config/providers.yaml         # Provider configurations, rate limits, timeouts
│   ├── gis_fetcher/core/             # Registry, caching, base classes
│   ├── gis_fetcher/providers/        # Weather, elevation, river, soil, marine, etc.
│   └── tests/                        # 13 automated tests
│
├── hazard_platform/                  # Scoring engine, ML pipeline, and GIS backend
│   ├── backend/api.py                # FastAPI endpoints (/api/zone-status, /api/analyze-point)
│   ├── data_pipeline/                # Normalization, cleaning, HazardReadingStore (SQLite)
│   ├── ml_service/                   # Trained models, feature engineering, AHP weights
│   ├── frontend/dashboard.html       # Interactive Leaflet GIS mapping interface
│   ├── pipeline_runner.py            # Live end-to-end ingestion pipeline runner
│   ├── zones.py                      # Multi-hazard zone definitions across India
│   └── tests/                        # 28 automated tests
│
├── rescue_arc_alert/                 # Emergency alert broadcast service & UI
│   ├── alert_service.py              # FastAPI service: Supabase bridge, FCM push, admin API
│   ├── admin.html                    # Lightweight, demo-focused, mobile-ready admin dashboard
│   ├── test_notify.html              # Citizen notification tester with floating pill toast
│   ├── subscriber.js                 # Embeddable browser script for "Get Zone Alerts" buttons
│   ├── firebase-messaging-sw.js      # Background service worker (delivers push when site is closed)
│   ├── schema.sql                    # Supabase Postgres schema (tables, views, RLS)
│   ├── schema_grants.sql             # Supabase table permission grants
│   ├── icons/                        # Alert badges and PWA icon assets
│   ├── requirements.txt              # Alert service dependencies
│   ├── README.md                     # Dedicated service documentation & FAQs
│   └── test_alert_system.py          # 22 automated tests
│
├── test_full_integrated_pipeline.py  # End-to-end runner: Live GIS -> ML -> FCM Alert -> Supabase
└── README.md                         # Master repository guide (this file)
```

---

## Prerequisites

* **Python 3.10+** (Python 3.11–3.13 supported)
* **Git**
* Modern Web Browser (Google Chrome, Microsoft Edge, or Mozilla Firefox)

---

## Installation & Setup

### 1. Clone Repository & Setup Virtual Environment

```powershell
# Clone the repository
git clone https://github.com/madhvendra1027/GIS-Scripts-FETCH-API-layer.git
cd GIS-Scripts-FETCH-API-layer

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS/Linux
```

### 2. Install Dependencies

Install packages in editable mode:

```powershell
# Install gis_fetcher
pip install -e gis_fetcher/

# Install hazard_platform dependencies
pip install -r hazard_platform/requirements.txt

# Install rescue_arc_alert dependencies
pip install -r rescue_arc_alert/requirements.txt

# (Optional) Dev & testing dependencies
pip install pytest pytest-asyncio httpx
```

### 3. Environment Configuration

Copy example environment files:

```powershell
# hazard_platform
copy hazard_platform\.env.example hazard_platform\.env       # Windows
# cp hazard_platform/.env.example hazard_platform/.env         # Linux/macOS

# rescue_arc_alert
copy rescue_arc_alert\.env.example rescue_arc_alert\.env     # Windows
# cp rescue_arc_alert/.env.example rescue_arc_alert/.env       # Linux/macOS
```

> **Configuration Persistence Note:** All Supabase URLs, service keys, and Firebase VAPID credentials are saved on disk in `.env` and `secrets/` (both protected by `.gitignore`). You do **not** need to re-enter or re-configure them on each startup.

---

## Running the Platform

To run the complete system, start the two independent microservices in separate terminal windows:

### Terminal 1: Start Hazard Platform & ML Engine (Port 8000)
```powershell
cd hazard_platform
python -m uvicorn backend.api:app --reload --port 8000
```
* **GIS API Status:** <http://localhost:8000/docs>
* **Interactive Map Interface:** Open `hazard_platform/frontend/dashboard.html` in your browser.

---

### Terminal 2: Start Alert Broadcast Service & Admin Console (Port 8001)
```powershell
cd rescue_arc_alert
python -m uvicorn alert_service:app --reload --port 8001
```
* **Admin Dashboard:** <http://localhost:8001/admin>
* **Subscriber & Notification Tester:** <http://localhost:8001/test>

---

## Running Tests

### 1. Automated Test Suites (63 / 63 Passing)
Run all unit and functional tests across each module:

```powershell
# Test GIS Fetchers (13 tests)
python -m pytest gis_fetcher/tests

# Test ML Scoring & Freshness (28 tests)
cd hazard_platform && python -m pytest tests && cd ..

# Test Alert System & Broadcast Rules (22 tests)
cd rescue_arc_alert && python -m pytest test_alert_system.py && cd ..
```

### 2. End-to-End Integrated System Pipeline Test
Execute a full live verification from raw data fetch to machine learning inference to cloud broadcast:

```powershell
python test_full_integrated_pipeline.py Z-ODISHA-PURI-01
```
*(Tests live Open-Meteo ingestion, RandomForest inference, Supabase cloud persistence, and WebPush payload generation).*

---

## Key Features & Capabilities

### 1. Mobile-Optimized Demo Admin Dashboard (`/admin`)
* **Dynamic Database Dropdown:** Automatically reads all zones from Supabase (`zones` table); any new region added to your database appears dynamically.
* **1-Click Simulation Presets:** Test emergency scenarios instantly without configuration:
  * 🌊 *Puri Coastal Surge* (`RED` · 89% Risk)
  * ⛰️ *Wayanad Landslide* (`RED` · 92% Risk)
  * 🌧️ *Patna River Flood* (`YELLOW` · 65% Risk)
  * ⚡ *Joshimath Subsidence* (`RED` · 86% Risk)
* **Inline Quick-Actions:** Directly trigger `RED`, `YEL`, `GRN`, or `↺ Reset` inside every row of the live zone table.
* **Header Controls:** Auto-poll sync countdown timer, synthesized Web Audio alert siren, 1-click **Reset All to Normal (GREEN)**, and slide-over **Citizen Smartphone Preview**.

### 2. Modern Floating Pill Notification HUD
* **Dynamic Island / Floating Pill Design:** Positioned top-center with an 8-second depleting countdown bar.
* **Color System:**
  * 🔴 **RED ALERT:** Pulsating crimson halo, siren beacon icon (`🚨`), `RED ALERT` badge, and high-urgency siren chime.
  * 🟡 **YELLOW WARNING:** Glowing amber pulse, warning icon (`⚠️`), `WARNING` badge, and cautionary chime.
  * 🟢 **GREEN ALL-CLEAR:** Calm emerald glow, shield icon (`🛡️`), and `ALL CLEAR` badge.
* **Expandable Drawer:** Smoothly folds out evacuation instructions, hazard percentage gauge, and action buttons.

### 3. Background Push Delivery
* **Delivers When Website is Closed:** W3C Service Worker (`firebase-messaging-sw.js`) receives background push packets and triggers native OS alerts (Windows Action Center, Android notification tray, and macOS banners).
* **Strict Geo-Targeting:** When a user subscribes, their GPS coordinates are mapped to the nearest hazard zone via `/api/analyze-point`. Alerts are broadcast exclusively to devices registered within that affected zone.

---

## Security & Git Integrity

* **Zero Hardcoded Secrets Committed:** `.env`, `.env.*`, `secrets/`, `*.db`, and service account keys are strictly protected by [`.gitignore`](.gitignore).
* **Supabase Row-Level Security (RLS):** Public access is limited to read-only status views; subscriber device tokens and notification logs are strictly protected via service-role keys.

---

## License & Credits

Developed for the **Smart India Hackathon 2026** (Problem Statement 26191). Built with FastAPI, Supabase, Firebase Cloud Messaging, Open-Meteo, USGS, Leaflet, and Scikit-Learn.
