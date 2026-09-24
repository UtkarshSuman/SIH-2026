# Rescue Arc — Full Deployment & Supabase Production Guide

This guide provides step-by-step instructions to deploy the entire **Rescue Arc** disaster-management platform to production using **Supabase** as the PostgreSQL database (with **PostGIS** and **pgvector**), **FastAPI** for the backend and RAG AI assistant, and the **GIS Operations Dashboard & Admin Portals**.

---

## 1. System Architecture Overview

```
                           ┌──────────────────────────────────────────────┐
                           │          Client Applications                 │
                           │  • GIS Operations Dashboard                  │
                           │  • Alert Admin Portal (/admin)               │
                           │  • RAG Knowledge Manager (/admin/documents)  │
                           └──────────────────────┬───────────────────────┘
                                                  │ HTTPS / SSE
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │         FastAPI Cloud Backend                │
                           │  • PostGIS Habitation GeoJSON Engine         │
                           │  • Firebase Realtime Alert Service           │
                           │  • RAG Chain (Gemini 1.5 Flash + MiniLM)     │
                           │  • Document Parser (PDF / TXT / MD)          │
                           └──────────────┬────────────────┬──────────────┘
                                          │                │
            Vector Similarity & GIS Data  │                │ AI Inference
                                          ▼                ▼
     ┌─────────────────────────────────────────┐   ┌──────────────────────────────┐
     │            Supabase Cloud               │   │    Google Gemini 1.5 Flash   │
     │  • PostgreSQL 15+                       │   │  • Free Tier (15 req/min)    │
     │  • PostGIS (Spatial queries)            │   │  • Function / Tool Calling   │
     │  • pgvector (384-dim document vectors)  │   │  • No credit card required   │
     │  • Habitations, Regions & Audit Logs    │   └──────────────────────────────┘
     └─────────────────────────────────────────┘
```

---

## 2. Step 1: Set Up Supabase Database

### 1.1 Create a Free Supabase Project
1. Go to [database.new](https://database.new) and sign in or create an account.
2. Click **New Project**.
3. Fill in:
   - **Name**: `rescue-arc-db` (or your preferred name)
   - **Database Password**: Set a strong password (save this securely).
   - **Region**: Choose the region closest to your users or backend server (e.g. `ap-south-1` Mumbai, `us-east-1` N. Virginia, etc.).
   - **Pricing Plan**: Free tier ($0/month).
4. Click **Create new project** and wait ~2 minutes for provisioning.

### 1.2 Enable Required Database Extensions
1. In the Supabase sidebar, navigate to **Database** → **Extensions**.
2. Search and toggle **ON** the following:
   - **`postgis`** — Required for spatial geometry points and `ST_Distance` calculations.
   - **`vector`** — Required for storing RAG document embeddings in Supabase.
   - **`uuid-ossp`** — For generating unique document IDs.

### 1.3 Execute the Schema Script
1. In the Supabase sidebar, click on **SQL Editor**.
2. Click **New Query**.
3. Open [`supabase_schema.sql`](file:///c:/Users/utkar/SIH/sih-main/backend2/supabase_schema.sql) from this repository, copy the full contents, and paste it into the SQL Editor.
4. Click **Run**.
5. You should see `Success. No rows returned`. This creates:
   - `regions` table (with the 10 standard disaster monitoring zones seeded)
   - `habitations` table (with spatial indexes on `geom`)
   - `rag_document_log` table (for admin tracking of all uploaded knowledge)
   - `rag_documents` table (with 384-dim `pgvector` index for AI search)
   - `get_habitations_geojson` stored procedure (dynamic distance computation)

### 1.4 Get Your Supabase Connection String
1. In Supabase, go to **Project Settings** (gear icon) → **Database**.
2. Scroll to **Connection string**.
3. Select **URI** tab.

> [!IMPORTANT]
> **Use the Connection Pooler (IPv4 Compatible)**
> 
> Many cloud deployment platforms (such as Render, Railway, Fly.io, and Vercel) connect via IPv4. Supabase direct connections (`db.[ref].supabase.co`) use IPv6 on the free tier.
> 
> Select **Connection Pooling** (Session mode or Transaction mode) or use the Pooler URI:
> ```
> postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require
> ```
> If your password contains special characters like `@`, `#`, `:`, or `/`, make sure to URL-encode them (e.g., `#` becomes `%23`).

---

## 3. Step 2: Environment Variables Configuration

Create a `.env` file (or set environment variables in your cloud hosting provider) using the following template:

```env
# ── Database (Supabase PostgreSQL) ───────────────────────────────────────────
DB_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require
DB_SSLMODE=require

# ── RAG Vector Store Configuration ───────────────────────────────────────────
# Use 'supabase' (or 'pgvector') for cloud persistence in Supabase,
# or 'chromadb' for local disk-based testing.
VECTOR_STORE_TYPE=supabase

# ── Google Gemini LLM (100% Free AI Tier) ────────────────────────────────────
# Get your free key at: https://aistudio.google.com
GEMINI_API_KEY=AIzaSy...your-actual-gemini-key
GEMINI_MODEL=gemini-1.5-flash

# ── Internal API Auth Key ────────────────────────────────────────────────────
# Used by Admin pages and frontend dashboards to call protected RAG endpoints
INTERNAL_API_KEY=dev-secret-key-change-in-production

# ── Embeddings & Chunking ────────────────────────────────────────────────────
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
RAG_TOP_K=4

# ── Frontend Base URL (for QR code & alert deep-links) ───────────────────────
FRONTEND_BASE_URL=https://your-frontend-domain.com
```

---

## 4. Step 3: Deploying the Backend

### Option A: Deploy to Render (Recommended Free Option)

1. Push your repository to GitHub / GitLab.
2. Sign in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `rescue-arc-backend`
   - **Region**: Choose the region closest to your Supabase DB (e.g. Frankfurt, Oregon, Singapore).
   - **Root Directory**: `backend2/backend` (or leave empty if your repo root is `backend`)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan Type**: `Free`
6. Click **Advanced** → **Add Environment Variable** and paste all variables from Section 3 above.
7. Click **Create Web Service**.
8. Once built, your backend URL will be live at: `https://rescue-arc-backend.onrender.com`.

---

### Option B: Deploy to Railway

1. Sign in to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Go to **Settings** → **Build & Start**:
   - **Root Directory**: `backend2/backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Go to **Variables** and add all variables from Section 3.
6. Click **Deploy**.

---

### Option C: Deploy via Docker / VPS

A production-ready `Dockerfile` is provided below:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t rescue-arc-backend .
docker run -d -p 8000:8000 --env-file .env rescue-arc-backend
```

---

## 5. Step 4: Admin Portal & Document Upload Workflow

Once deployed, the backend automatically serves the **Alert Admin** and the **RAG Knowledge Base Document Manager**:

### 5.1 Accessing the Admin Portals
- **Alert Admin Portal**: `https://your-backend.com/admin`
  - Allows selecting any disaster region and triggering / resetting alerts.
  - Contains the prominent **Upload Documents for RAG System** navigation button.
- **RAG Document Management Portal**: `https://your-backend.com/admin/documents`
  - Accessible directly or by clicking the green button on `/admin`.

### 5.2 Uploading Files into Supabase RAG Knowledge Base
1. Open `https://your-backend.com/admin/documents`.
2. Ensure your backend URL is filled in (automatically detected) and verify the `X-API-Key`.
3. Choose your ingestion method:
   - **File Upload Tab**: Drag & drop any `.pdf`, `.txt`, or `.md` file (e.g. `National Disaster Management Plan.pdf`, `Joshimath Landslide SOP.txt`).
   - Click **Upload & Chunk into Vector Store**.
   - The file is automatically parsed, split into 1000-character overlapping chunks, embedded using `all-MiniLM-L6-v2`, and stored in Supabase's `rag_documents` table.
   - **Direct Text Tab**: Paste village emergency circulars or relief instructions, choose a category (`SOP`, `Evacuation Plan`, `Hazard Guidelines`), and click **Ingest Text**.
4. The **Ingested Knowledge Library** table updates in real time to show the indexed documents, chunk counts, and timestamps.
5. In the **Test Knowledge Retrieval** sandbox on the right, type any question (e.g. *"What is the evacuation protocol for red zones?"*) to immediately verify that Gemini retrieves your uploaded knowledge!

---

## 6. Step 5: Connecting & Deploying the GIS Dashboard

### 6.1 Configuring the API Base URL
In [`dashboard/GIS_Dashboard.html`](file:///c:/Users/utkar/SIH/sih-main/backend2/dashboard/GIS_Dashboard.html):
Locate the API URL configuration (or use the built-in URL switch):
```javascript
const API_BASE = "https://your-deployed-backend.onrender.com";
```

### 6.2 Deploying the Dashboard
Because `GIS_Dashboard.html` is a standalone static application with Leaflet maps, it can be hosted for free on:
- **Vercel** (`vercel deploy`)
- **Netlify** (Drag-and-drop the `dashboard` folder)
- **GitHub Pages** (Enable GitHub Pages under repo Settings → Pages)
- **FastAPI Static Route** (Served directly from the backend)

---

## 7. Step 6: Post-Deployment Verification Checklist

Run these quick checks against your deployed URL to ensure 100% operational status:

| Check | URL / Command | Expected Result |
|---|---|---|
| **Health Probe** | `GET https://your-backend.com/health` | `{"status": "ok", "database": "ok"}` |
| **Alert Admin** | `GET https://your-backend.com/admin` | Interactive Rescue Arc Alert Admin UI loads |
| **RAG Admin** | `GET https://your-backend.com/admin/documents` | Knowledge Base upload portal loads |
| **Habitations API** | `GET https://your-backend.com/api/habitations?region=joshimath_uttarakhand` | GeoJSON `FeatureCollection` with live distance calculations |
| **RAG Document List** | `GET https://your-backend.com/api/v1/rag/documents` *(with `X-API-Key`)* | `{"documents": [...], "total": N}` |
| **RAG AI Chat Stream** | `POST https://your-backend.com/api/v1/rag/chat` | Server-Sent Events (SSE) token stream from Gemini 1.5 Flash |

---

## 8. Troubleshooting & Supabase Gotchas

### 1. `psycopg2.OperationalError: SSL SYSCALL error: EOF detected` or Timeout
- **Cause**: Connecting directly to `db.[ref].supabase.co` on an IPv4-only cloud host.
- **Fix**: Switch to the **Supabase Connection Pooler** URI (`aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`).

### 2. `NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres`
- **Cause**: Supabase connection string begins with `postgres://` instead of `postgresql+psycopg2://`.
- **Status**: **Fixed automatically** in our backend codebase (`app/rag/models.py`), which normalizes any `postgres://` or `postgresql://` URI.

### 3. `RuntimeError: The python-multipart package is required for files or form data.`
- **Cause**: Missing `python-multipart` library required by FastAPI's `UploadFile`.
- **Status**: **Fixed & included** in [`requirements.txt`](file:///c:/Users/utkar/SIH/sih-main/backend2/requirements.txt).

### 4. `GoogleGenerativeAIError: API_KEY_INVALID` or `RESOURCE_EXHAUSTED`
- **Cause**: Missing or incorrect Gemini API key, or exceeding 15 requests/minute on the free tier.
- **Fix**: Verify `GEMINI_API_KEY` at [Google AI Studio](https://aistudio.google.com). For high-concurrency production deployments, consider creating a second free key or enabling pay-as-you-go billing.
