# Rescue Arc — Step-by-Step Supabase Deployment & Admin RAG Guide

This document is a focused, step-by-step guide specifically covering the **Supabase database setup**, **Admin Document Upload portal**, and the **production deployment workflow** implemented for the Rescue Arc platform.

---

## 1. What Was Built & Updated

1. **Admin Portal Navigation**:
   - Added a direct navigation card and button on the Alert Admin page: **"Upload Documents for RAG System"**.
   - Accessible at: `http://localhost:8000/admin` (or deployed equivalent).

2. **Dedicated RAG Knowledge Base Admin Portal**:
   - Built a custom, dark-theme management UI at: `http://localhost:8000/admin/documents`.
   - **File Upload**: Drag & drop or browse `.pdf`, `.txt`, and `.md` files.
   - **Direct Text Ingestion**: Form to paste emergency SOPs and relief guidelines with category tagging.
   - **Live Ingested Documents Table**: Shows all indexed documents, chunk counts, and timestamps.
   - **Interactive AI Sandbox**: Real-time prompt box to test semantic retrieval with Google Gemini 1.5 Flash.

3. **Supabase Database & pgvector Integration**:
   - Ready-to-run schema script: [`supabase_schema.sql`](file:///c:/Users/utkar/SIH/sih-main/backend2/supabase_schema.sql).
   - Enables `postgis`, `vector`, and `uuid-ossp`.
   - Dual-mode vector store in [`app/rag/vector_store.py`](file:///c:/Users/utkar/SIH/sih-main/backend2/backend/app/rag/vector_store.py) supporting both local ChromaDB and cloud Supabase pgvector (`VECTOR_STORE_TYPE=supabase`).
   - Resilient database connection handling for `postgres://` and `postgresql://` pooler URIs.

4. **Production Dependencies & Docker**:
   - Pinned dependencies including `python-multipart` in [`backend/requirements.txt`](file:///c:/Users/utkar/SIH/sih-main/backend2/backend/requirements.txt).
   - Production container recipe in [`Dockerfile`](file:///c:/Users/utkar/SIH/sih-main/backend2/Dockerfile).

---

## 2. Step-by-Step Procedure

### Step 1: Set Up Supabase Database

1. Sign up or log in at **[supabase.com](https://supabase.com)**.
2. Click **New Project**:
   - **Name**: `rescue-arc-db`
   - **Database Password**: Set and record a secure password.
   - **Region**: Choose the closest region (e.g., `ap-south-1` Mumbai).
   - **Plan**: Free ($0/month).
3. In Supabase sidebar, go to **SQL Editor** → **New Query**.
4. Open [`supabase_schema.sql`](file:///c:/Users/utkar/SIH/sih-main/backend2/supabase_schema.sql), copy everything, paste into the editor, and click **Run**.
   - This creates `regions`, `habitations`, `rag_document_log`, `rag_documents`, and the `get_habitations_geojson` function.
5. In Supabase sidebar, go to **Project Settings** (gear icon) → **Database**:
   - Scroll down to **Connection String** → **URI**.
   - Select the **Connection Pooling** tab (recommended for IPv4 cloud hosts like Render and Railway).
   - Copy the URI. It will look like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - Replace `[YOUR-PASSWORD]` with your real database password.

---

### Step 2: Configure Environment Variables

In `backend2/.env` (and in your cloud hosting provider's dashboard):

```env
# Database (Supabase Connection Pooler URI)
DB_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
DB_SSLMODE=require

# Vector Store (Use 'supabase' for cloud, 'chromadb' for offline local)
VECTOR_STORE_TYPE=supabase

# Free Google Gemini AI Key (from https://aistudio.google.com)
GEMINI_API_KEY=AIzaSy...your-gemini-key
GEMINI_MODEL=gemini-1.5-flash

# Internal Authentication Key
INTERNAL_API_KEY=dev-secret-key-change-in-production

# Chunking & Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
RAG_TOP_K=4
```

---

### Step 3: Run & Test Locally

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd C:\Users\utkar\SIH\sih-main\backend2\backend
   ```
2. Start the FastAPI server:
   ```powershell
   & "C:\Users\utkar\SIH\sih-main\.venv\Scripts\uvicorn.exe" main:app --reload --port 8000
   ```
3. Verify the endpoints in your browser:
   - **Health Check**: `http://127.0.0.1:8000/health`
   - **Alert Admin**: `http://127.0.0.1:8000/admin`
   - **RAG Document Upload Portal**: `http://127.0.0.1:8000/admin/documents`

---

### Step 4: Upload Documents into the RAG Knowledge Base

1. Navigate to `http://127.0.0.1:8000/admin`.
2. Click the green button: **"Upload Documents for RAG System"**.
3. You will be redirected to `http://127.0.0.1:8000/admin/documents`.
4. Choose an upload method:
   - **Option A — File Upload**:
     - Drag & drop or browse a `.pdf`, `.txt`, or `.md` file (e.g. disaster SOP, evacuation plan, or NDRF report).
     - Click **"Upload & Chunk into Vector Store"**.
     - The file is chunked, embedded via MiniLM (384-dimensional vectors), and stored directly in Supabase's `rag_documents` table.
   - **Option B — Direct Text / SOP**:
     - Switch to the "Direct Text / SOP" tab.
     - Enter a Title (e.g. *Joshimath Flood Evacuation Protocol*).
     - Choose a Category (`SOP`, `Evacuation Plan`, `Hazard Guidelines`).
     - Paste the guidelines text and click **"Ingest Text into Vector Store"**.
5. Look at the **Ingested Knowledge Library** table at the bottom of the page — your document will appear with its chunk count and timestamp.

---

### Step 5: Verify AI Retrieval in Real Time

On the right side of the `/admin/documents` page:
1. Under **"Test Knowledge Retrieval"**, click a suggestion chip or type a question:
   - *Example*: "What are the high-risk zones in Joshimath?"
   - *Example*: "What is the standard evacuation procedure for red zones?"
2. Click **Ask**.
3. Gemini 1.5 Flash streams the answer in real time using the context retrieved from your uploaded documents and live PostGIS tables.

---

### Step 6: Deploy to Cloud (Render / Railway / Docker)

#### Deploying on Render:
1. Push your repository to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.
3. Connect your repo and set:
   - **Root Directory**: `backend2/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the environment variables from **Step 2**.
5. Click **Create Web Service**.

#### Deploying via Docker:
Run with the provided [`Dockerfile`](file:///c:/Users/utkar/SIH/sih-main/backend2/Dockerfile):
```bash
docker build -t rescue-arc-backend .
docker run -d -p 8000:8000 --env-file .env rescue-arc-backend
```

---

## 3. Quick Verification Commands

Test your deployment with these PowerShell or cURL commands:

```powershell
# 1. Health Probe
curl.exe http://127.0.0.1:8000/health

# 2. Check Document List (Authenticated)
curl.exe -H "X-API-Key: dev-secret-key-change-in-production" http://127.0.0.1:8000/api/v1/rag/documents

# 3. Test Habitations PostGIS API
curl.exe "http://127.0.0.1:8000/api/habitations?region=joshimath_uttarakhand"

# 4. Stream AI Response via POST
curl.exe -X POST http://127.0.0.1:8000/api/v1/rag/chat `
  -H "Content-Type: application/json" `
  -H "X-API-Key: dev-secret-key-change-in-production" `
  -d '{"message":"What are the red zones in Joshimath?"}'
```
