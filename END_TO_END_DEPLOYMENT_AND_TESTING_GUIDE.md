# Rescue Arc — Complete End-to-End Testing & Production Deployment Guide

> **Project**: Rescue Arc — Multi-Hazard Red Zone Prediction & Sphere-Standard Relocation Decision Support System (SIH Problem Statement 26191)  
> **Repository Root**: `c:\Users\utkar\SIH\sih-main`  
> **Last Verified**: September 2026

---

## Table of Contents

1. [Architecture Overview & Component Map](#1-architecture-overview--component-map)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [Step-by-Step Procedure to Run and Test the Whole Flow (Local)](#3-step-by-step-procedure-to-run-and-test-the-whole-flow-local)
   - [Phase 1: Database Setup & Synchronization](#phase-1-database-setup--synchronization)
   - [Phase 2: GIS Ingestion & ML Model Inference](#phase-2-gis-ingestion--ml-model-inference)
   - [Phase 3: Python FastAPI Backend (Alerts & RAG)](#phase-3-python-fastapi-backend-alerts--rag)
   - [Phase 4: Next.js Frontend Web Application](#phase-4-nextjs-frontend-web-application)
   - [Phase 5: End-to-End Functional Testing Matrix](#phase-5-end-to-end-functional-testing-matrix)
4. [Production Deployment Guide: Which to Deploy Where and How](#4-production-deployment-guide-which-to-deploy-where-and-how)
   - [Deployment Target 1: Next.js Frontend → Vercel](#deployment-target-1-nextjs-frontend--vercel)
   - [Deployment Target 2: Python FastAPI Backend → Render](#deployment-target-2-python-fastapi-backend--render)
   - [Deployment Target 3: PostgreSQL & PostGIS Database → Supabase](#deployment-target-3-postgresql--postgis-database--supabase)
   - [Deployment Target 4: ML Prediction Cron / Worker → Render Background Worker](#deployment-target-4-ml-prediction-cron--worker--render-background-worker)
5. [Complete Environment Variables Reference](#5-complete-environment-variables-reference)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Architecture Overview & Component Map

Rescue Arc consists of four seamlessly synchronized modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 WEB FRONTEND                        │
│                                                                        │
│   • Live Red Zone Map (Leaflet)      • Relocation Corridors (OSRM)     │
│   • Advanced Analytics Time-Series   • Admin Capacity Management       │
│                                                                        │
│          ▲                                            ▲                │
│   HTTP   │ 4s Polling Auto-Update              REST   │ API Updates    │
│          ▼                                            ▼                │
│  /api/zones, /api/v1/relocation/*              /api/admin/*, /api/ml/* │
└───────────────────────▲──────────────────────▲────────────────────────┘
                        │                      │
                        ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENT MULTI-TIER DATABASE                       │
│                                                                        │
│   • Prisma ORM / PostgreSQL on Supabase (Port 6543 / 5432)             │
│   • Resilient Local JSON Snapshot Store (Sub-20ms Page Loads)          │
│   • Tables: Zone, RelocationSite, RelocationPlan, HazardHistory        │
└───────────────────────▲────────────────────────────────────────────────┘
                        │
                        │ Database Sync / Scored Telemetry
                        │
┌───────────────────────┴────────────────────────────────────────────────┐
│                  GIS INGESTION & ML PREDICTION ENGINE                  │
│                                                                        │
│   1. gis_fetcher: Live queries Open-Meteo, Elevation, GloFAS, NASA     │
│   2. data_pipeline: Normalization, Range Checks, Historical Imputation │
│   3. ml_service: 4 Trained Random Forest Regressors (joblib)           │
│   4. Decision Engines: AHP Urgency Matrix & Sphere Relocation DSS      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & Environment Setup

### Required Runtimes & Tools
- **Node.js**: `v20.x` or `v22.x` (LTS)
- **Package Manager**: `pnpm` (`v9.x` or `v10.x`) — install via `npm i -g pnpm`
- **Python**: `3.10` to `3.13` (64-bit)
- **Git**: Installed and in PATH

---

## 3. Step-by-Step Procedure to Run and Test the Whole Flow (Local)

### Phase 1: Database Setup & Synchronization

1. **Verify Environment Variables in Packages**:
   In `sih-main/.env` and `sih-main/packages/database/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:Rt4o3HvKDeJwgB69@db.wisugxuyzomxdayekmev.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:Rt4o3HvKDeJwgB69@db.wisugxuyzomxdayekmev.supabase.co:5432/postgres"
   ```

2. **Generate the Typed Prisma Client**:
   ```powershell
   cd c:\Users\utkar\SIH\sih-main\packages\database
   
   ```

3. **Push Schema to PostgreSQL on Supabase**:
   ```powershell
   npx prisma db push --accept-data-loss
   ```
   *Output confirmation*: `Your database is now in sync with your Prisma schema.`

---

### Phase 2: GIS Ingestion & ML Model Inference

All GIS fetch scripts, pipeline normalization, and ML models live in:
`sih-main/backend-main/backend/GIS-Scripts-FETCH-API-layer/hazard_platform`

1. **Test ML Models & Scorer Logic (Offline Example Run)**:
   ```powershell
   cd c:\Users\utkar\SIH\sih-main\backend-main\backend\GIS-Scripts-FETCH-API-layer\hazard_platform
   python example_run.py
   ```
   *Expected Output*:
   - Cleaned parameters for FLOOD, LANDSLIDE, EROSION, CLOUDBURST.
   - Individual hazard scores (e.g. Flood `0.664`, Landslide `0.535`).
   - Zone Classification (`YELLOW`) and Relocation Urgency (`SHORT_TERM`).

2. **Run the Live Network Pipeline (Fetch Real Satellite & Weather Telemetry)**:
   ```powershell
   python pipeline_runner.py Z-BIHAR-PATNA-01 --no-auto-refresh-static
   ```
   *What happens*:
   - Queries Open-Meteo for live rainfall (24h & 72h).
   - Queries Open-Elevation for real elevation (55m) and slope (0.64°).
   - Queries GloFAS river discharge (8.25 m³/s).
   - Normalizes, imputes missing values via `ZoneHistory`, and saves readings to `hazard_readings.db`.

3. **Run Trained Random Forest Regression on Live Readings**:
   ```powershell
   python -c "from backend.api import _score_zone; c, r, o = _score_zone('Z-BIHAR-PATNA-01'); print('Zone:', c.color.value, 'Worst:', c.worst_hazard.value, round(c.worst_score, 3), 'Relocation Urgency:', r.priority.value)"
   ```
   *Expected Output*:
   - Evaluates all 4 `.joblib` Random Forest Regressors.
   - Applies the inland guardrail (Erosion = `0.000` for inland plains).
   - Prints: `Zone: GREEN Worst: FLOOD 0.315 Relocation Urgency: NONE`.

4. **Sync ML Predictions to the Web Application Database**:
   ```powershell
   python sync_predictions_to_db.py
   ```
   *What happens*:
   - Runs predictions for all registered zones (Patna, Joshimath, Wayanad, Guwahati, Puri).
   - Sends HTTP POST payloads to the web app's `/api/ml/update-prediction` endpoint.
   - Updates `Zone` status in the database and appends new time-series points to `HazardHistory`.

---

### Phase 3: Python FastAPI Backend (Alerts & RAG)

1. **Install Backend Dependencies**:
   ```powershell
   cd c:\Users\utkar\SIH\sih-main\backend-main\backend
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Backend**:
   ```powershell
   python -m uvicorn main:app --reload --port 8000
   ```

3. **Verify FastAPI Endpoints**:
   - **Health Check**: `http://localhost:8000/health` (Returns `{"status": "ok", "database": "ok"}`)
   - **Alert Administration**: `http://localhost:8000/admin`
   - **RAG Knowledge Base & Document Ingestion**: `http://localhost:8000/admin/documents`

---

### Phase 4: Next.js Frontend Web Application

1. **Install Dependencies (Turborepo Monorepo Root)**:
   ```powershell
   cd c:\Users\utkar\SIH\sih-main
   pnpm install
   ```

2. **Run TypeScript Check to Ensure Clean Compilation**:
   ```powershell
   cd frontend
   npx tsc --noEmit
   ```
   *Expected Output*: Exit code `0` (Zero errors).

3. **Start the Next.js Development Server**:
   ```powershell
   pnpm --filter @sih/web dev
   # OR
   cd frontend
   pnpm dev
   ```
   *The application will boot at*: **`http://localhost:3000`**

---

### Phase 5: End-to-End Functional Testing Matrix

| Feature | URL to Open | What to Verify |
| :--- | :--- | :--- |
| **Dynamic Zone Map** | `http://localhost:3000/#map` | 1. Markers load dynamically with correct ML colors (`RED`, `YELLOW`, `GREEN`).<br>2. Click any zone pill (Joshimath, Wayanad, Patna) $\rightarrow$ map flies to location.<br>3. Panel displays dynamic ML scores, 24h rain, river flow, and slope.<br>4. Type "Guwahati" in search $\rightarrow$ auto-centers and filters. |
| **Relocation Corridors & Sphere Carrying Capacity** | `http://localhost:3000/relocation` | 1. Summary cards display Evacuee Demand vs Sphere Capacity ($45\text{ m}^2/\text{person}$).<br>2. GIS Route Map shows **actual road polylines** connecting Red Zones to safe townships.<br>3. Candidate site cards show total area, usable shelter area, and remaining headroom.<br>4. Occupancy progress bar displays color-coded capacity load. |
| **Advanced Analytics Dashboard** | `http://localhost:3000/analytics` | 1. 14-day chronological multi-hazard trajectory chart renders risk trends.<br>2. Threshold lines appear at 0.70 (Critical) and 0.40 (Warning).<br>3. Meteorological matrix displays rainfall vs river level correlation.<br>4. Switch location dropdown between Joshimath, Wayanad, and Patna. |
| **Admin Carrying Capacity Management** | `http://localhost:3000/admin/relocation-sites` | 1. View all candidate townships in database table.<br>2. Click **"Edit Capacity"** on Pipalkoti $\rightarrow$ change capacity from `3,200` to `4,000` $\rightarrow$ click **"Commit Capacity to Database"**.<br>3. Open `http://localhost:3000/relocation` in another tab $\rightarrow$ observe capacity **auto-updated to 4,000** without reload! |
| **Live ML Ingestion Simulation** | `http://localhost:3000/admin/relocation-sites` | 1. Under "ML Prediction Simulator", select Wayanad.<br>2. Drag 72h Rainfall to 250mm, Landslide Score to 0.95 $\rightarrow$ Click **"Publish ML Scores to Database"**.<br>3. Look at `http://localhost:3000/#map` $\rightarrow$ Wayanad automatically turns bright RED.<br>4. Look at `http://localhost:3000/analytics` $\rightarrow$ new spike point appended to chart! |

---

## 4. Production Deployment Guide: Which to Deploy Where and How

### Deployment Architecture Map

| Service / Layer | Code Location in Repo | Recommended Cloud Platform | Why This Platform? |
| :--- | :--- | :--- | :--- |
| **Web Frontend & API Routes** | `sih-main/frontend` | **Vercel** | Native Next.js 16 support, sub-second Edge deployment, automatic SSL, zero cold starts. |
| **Python Backend, Alerts & RAG** | `sih-main/backend-main/backend` | **Render** (Web Service) | Native Python runtime, persistent disk support, direct WebSocket/SSE streaming. |
| **Database & Spatial Indexing** | `sih-main/packages/database` | **Supabase** (PostgreSQL) | PostGIS spatial extensions, pgvector for semantic search, connection pooling. |
| **GIS ML Ingestion & Scoring Worker** | `hazard_platform/pipeline_runner.py` | **Render Cron Job** (or Celery) | Scheduled headless execution every 30-60 mins to refresh weather telemetry. |

---

### Deployment Target 1: Next.js Frontend → Vercel

1. **Push your code to GitHub / GitLab**.
2. Go to **[vercel.com](https://vercel.com)** $\rightarrow$ Click **"Add New Project"** $\rightarrow$ Import your `SIH` repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `sih-main/frontend` (or set Root to `sih-main` with build filter)
   - **Build Command**: `pnpm --filter @sih/web build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
4. **Set Environment Variables in Vercel Dashboard**:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   NEXTAUTH_SECRET="your-generated-random-32-byte-secret"
   NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
   REQUIRE_EMAIL_VERIFICATION="false"
   NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
   ML_SERVICE_URL="https://rescue-arc-backend.onrender.com"
   ```
5. Click **Deploy**. Vercel will build the bundle, generate the Prisma client, and publish your site with a global CDN.

---

### Deployment Target 2: Python FastAPI Backend → Render

1. Go to **[render.com](https://render.com)** $\rightarrow$ Click **"New +"** $\rightarrow$ **"Web Service"**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `rescue-arc-backend`
   - **Region**: Singapore / Frankfurt / Oregon (closest to database)
   - **Root Directory**: `sih-main/backend-main/backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. **Set Environment Variables in Render Dashboard**:
   ```env
   PYTHON_VERSION=3.13.7
   DB_URL=postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   DB_SSLMODE=require
   FRONTEND_BASE_URL=https://your-vercel-domain.vercel.app
   VECTOR_STORE_TYPE=supabase
   GEMINI_API_KEY=AIzaSy...your-gemini-key
   INTERNAL_API_KEY=your-production-secret-token
   ```
5. Click **Create Web Service**. Render builds the container, runs `/health` checks, and provisions an HTTPS URL.

---

### Deployment Target 3: PostgreSQL & PostGIS Database → Supabase

1. Sign up at **[supabase.com](https://supabase.com)** $\rightarrow$ Click **"New Project"**.
   - **Database Name**: `rescue-arc-db`
   - **Region**: Choose closest to Render/Vercel (e.g. `ap-south-1` Mumbai).
2. Go to **SQL Editor** $\rightarrow$ **New Query**:
   - Run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     CREATE EXTENSION IF NOT EXISTS "postgis";
     CREATE EXTENSION IF NOT EXISTS "vector";
     ```
3. In **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection String**:
   - Select the **Connection Pooling** tab (Port 6543).
   - Copy the URI for use in Render and Vercel.
4. From your local machine, run the migration against production:
   ```powershell
   cd sih-main\packages\database
   npx prisma db push
   ```

---

### Deployment Target 4: ML Prediction Cron / Worker → Render Background Worker

To run GIS weather telemetry queries and ML model scoring automatically in the background:

1. In Render Dashboard, click **"New +"** $\rightarrow$ **"Cron Job"**.
2. **Settings**:
   - **Name**: `rescue-arc-gis-ml-worker`
   - **Root Directory**: `sih-main/backend-main/backend/GIS-Scripts-FETCH-API-layer/hazard_platform`
   - **Schedule**: `*/30 * * * *` (Every 30 minutes)
   - **Command**: `python pipeline_runner.py Z-UTTARAKHAND-JOSHIMATH-01 --no-auto-refresh-static && python sync_predictions_to_db.py --api-url https://your-vercel-domain.vercel.app/api/ml/update-prediction`
3. This periodically queries Open-Meteo and GloFAS, recalculates Random Forest hazard scores, and pushes updates straight to the live database!

---

## 5. Complete Environment Variables Reference

| Variable Name | Required By | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Frontend & Backend | PostgreSQL pooler connection string | `postgresql://postgres:...@pooler.supabase.com:6543/postgres?sslmode=require` |
| `DIRECT_URL` | Prisma CLI | Direct PostgreSQL connection for migrations | `postgresql://postgres:...@db.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | Frontend | Session encryption secret key | `jJ654hccZuQIt0w2klF2wRqaIihAVuucq+jGy3aDtYY` |
| `NEXTAUTH_URL` | Frontend | Canonical production frontend URL | `https://rescue-arc7.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Frontend | Public base URL for client routing | `https://rescue-arc7.vercel.app` |
| `ML_SERVICE_URL` | Frontend | URL of deployed FastAPI backend | `https://rescue-arc.onrender.com` |
| `INTERNAL_API_KEY` | Frontend & Backend | Shared bearer token for admin routes | `dev-secret-key-change-in-production` |
| `GEMINI_API_KEY` | Backend | Google Gemini 1.5 Flash API Key | `AIzaSy...` (from Google AI Studio) |
| `VECTOR_STORE_TYPE` | Backend | Vector storage backend (`supabase` or `chromadb`) | `supabase` |

---

## 6. Troubleshooting & FAQs

### Q1: Why does `prisma db push` report data loss warnings?
> **Answer**: When syncing a schema with new uppercase models (`Zone`, `RelocationSite`), Prisma asks to replace old lowercase temporary tables. Run with `npx prisma db push --accept-data-loss` to proceed safely.

### Q2: What happens if an external satellite or weather API is slow or offline?
> **Answer**: The application implements the **Snapshot-First Read Pattern**. Pages read pre-computed, verified database snapshots from `rescue_arc_database.json` and Supabase. The website never blocks, stalls, or crashes waiting for external APIs.

### Q3: How do new ML scores show up on the map without refreshing?
> **Answer**: Both `map-section.jsx` and `relocation/page.tsx` poll `/api/version` every 4 seconds. When new ML predictions or admin capacity changes are recorded, the version increments and the UI smoothly updates markers and stats in real time.

### Q4: How is the Relocation Carrying Capacity calculated?
> **Answer**: Strictly according to the international **Sphere Project Minimum Standard**:
> $$\text{Sphere Capacity} = \left\lfloor \frac{\text{Usable Shelter Area in m}^2}{45\text{ m}^2/\text{person}} \right\rfloor$$
> Editing usable area in `/admin/relocation-sites` automatically recalculates this capacity.
