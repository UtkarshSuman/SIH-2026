# RAG Chatbot System — Build Plan & Usage Guide

## System Overview

A fully-functioning **Retrieval-Augmented Generation (RAG)** chatbot built into the Rescue Arc hazard monitoring platform. It answers questions by combining:
1. **Semantic document search** — ChromaDB (local SQLite, zero setup)
2. **Live database queries** — real `habitations` + `regions` PostGIS tables
3. **LLM reasoning** — Google Gemini 1.5 Flash (free tier)
4. **Streaming responses** — SSE token-by-token to the frontend

All resources used are **free** — no paid APIs, no cloud vector stores.

---

## Architecture

```
User Question
      │
      ▼
┌──────────────────────────────────────────┐
│        FastAPI  /api/v1/rag/*            │
│  POST /rag/chat        → SSE stream      │
│  POST /rag/ingest      → text ingest     │
│  POST /rag/ingest-file → PDF upload      │
│  GET  /rag/documents   → admin list      │
│  GET  /rag/db-context  → live DB dump    │
└───────────────┬──────────────────────────┘
                │
       ┌────────▼────────┐
       │   chain.py       │
       │  Gemini 1.5 Flash│
       │  + Tool Calling  │
       └──┬───────────┬───┘
          │           │
          ▼           ▼
    ┌──────────┐ ┌─────────────────────────┐
    │ChromaDB  │ │ 5 Live DB Tools          │
    │(local    │ │ get_zone_status          │
    │SQLite)   │ │ get_high_risk_habitations│
    │retriever │ │ get_region_summary       │
    └──────────┘ │ get_relocation_plan      │
                 │ get_all_active_regions   │
                 └──────────┬──────────────┘
                            │
                     ┌──────▼───────┐
                     │ PostgreSQL   │
                     │ (Render)     │
                     │ habitations  │
                     │ regions      │
                     └─────────────┘
```

---

## Files Created / Modified

| File | Status | Purpose |
|---|---|---|
| `app/core/config.py` | Modified | Pydantic v2 Settings — all env vars |
| `app/rag/db.py` | **NEW** | psycopg2 DB helper for RAG tools |
| `app/rag/embeddings.py` | Modified | Local HuggingFace embeddings singleton |
| `app/rag/vector_store.py` | Modified | ChromaDB (replaces PGVector) |
| `app/rag/retriever.py` | Modified | Text + PDF file ingestion |
| `app/rag/tools.py` | Modified | 5 real-schema DB tools |
| `app/rag/chain.py` | Modified | Gemini 1.5 Flash chain (replaces Groq) |
| `app/rag/models.py` | Modified | Document log table (fixed imports) |
| `app/rag/seed_documents.py` | **NEW** | Pre-loads project docs into ChromaDB |
| `app/api/routes/rag.py` | Modified | 5 endpoints incl. file upload + db-context |
| `app/api/deps.py` | Modified | Auth using settings.internal_api_key |
| `app/schemas/rag.py` | Modified | Full Pydantic request/response models |
| `app/gis/database.py` | **NEW** | Compatibility shim for old imports |
| `requirements_rag.txt` | **NEW** | All RAG pip dependencies |
| `.env` | Modified | Added GEMINI_API_KEY, CHROMA_PATH, INTERNAL_API_KEY |

---

## Step 1: Get Your Free Gemini API Key

1. Go to **https://aistudio.google.com**
2. Click **Get API Key** → **Create API Key**
3. Copy the key and paste it in `.env`:

```env
GEMINI_API_KEY=AIza...your-key-here
```

Free tier limits: **15 requests/minute**, **1 million tokens/day** — more than enough for development and demos.

---

## Step 2: Install Dependencies

```powershell
# From the backend2/ directory
cd C:\Users\utkar\SIH\sih-main\backend2\backend
pip install -r requirements_rag.txt
```

Or install into the existing venv:
```powershell
C:\Users\utkar\SIH\sih-main\.venv\Scripts\python.exe -m pip install -r requirements_rag.txt
```

---

## Step 3: Seed Knowledge Base

Pre-load project documents into ChromaDB (run once):

```powershell
cd C:\Users\utkar\SIH\sih-main\backend2\backend
C:\Users\utkar\SIH\sih-main\.venv\Scripts\python.exe -m app.rag.seed_documents
```

This ingests:
- `README.md` files (project overview)
- `WEIGHT_JUSTIFICATION.md` (AHP methodology)
- `testreadme.md` (testing guide)
- Inline DB schema description
- Zone classification system explanation

---

## Step 4: Start the Server

```powershell
cd C:\Users\utkar\SIH\sih-main\backend2\backend
C:\Users\utkar\SIH\sih-main\.venv\Scripts\uvicorn.exe main:app --reload --port 8000
```

---

## Step 5: Test the Endpoints

### Chat (streaming SSE)
```powershell
curl -X POST http://localhost:8000/api/v1/rag/chat `
  -H "X-API-Key: dev-secret-key-change-in-production" `
  -H "Content-Type: application/json" `
  -d '{"message": "Which areas in Joshimath are in the red zone?"}'
```

### Ingest a text document
```powershell
curl -X POST http://localhost:8000/api/v1/rag/ingest `
  -H "X-API-Key: dev-secret-key-change-in-production" `
  -H "Content-Type: application/json" `
  -d '{"title":"AHP Overview","sourceType":"text","content":"AHP (Analytic Hierarchy Process) is used..."}'
```

### Upload a PDF
```powershell
curl -X POST http://localhost:8000/api/v1/rag/ingest-file `
  -H "X-API-Key: dev-secret-key-change-in-production" `
  -F "file=@C:\path\to\document.pdf"
```

### List ingested documents
```powershell
curl http://localhost:8000/api/v1/rag/documents `
  -H "X-API-Key: dev-secret-key-change-in-production"
```

### Live DB context (test DB connectivity)
```powershell
curl "http://localhost:8000/api/v1/rag/db-context?region=joshimath" `
  -H "X-API-Key: dev-secret-key-change-in-production"
```

---

## Sample Questions the Chatbot Can Answer

| Question | Data Source Used |
|---|---|
| "Which villages in Wayanad are in the red zone?" | `get_high_risk_habitations` tool → live DB |
| "What is the current risk level in Joshimath?" | `get_zone_status` tool → live DB |
| "How many red-zone habitations are there in Idukki?" | `get_region_summary` tool → live DB |
| "Where will people from Gauri village be relocated?" | `get_relocation_plan` tool → live DB |
| "Which regions does Rescue Arc monitor?" | `get_all_active_regions` tool → live DB |
| "How does AHP weighting work?" | ChromaDB vector search → documents |
| "What is slope class?" | ChromaDB vector search → documents |
| "Explain the scoring model" | ChromaDB vector search → documents |

---

## Environment Variables Reference

```env
# Database (required for live DB tools)
DB_URL=postgresql://user:pass@host/dbname
DATABASE_URL=postgresql://user:pass@host/dbname   # fallback

# Gemini API (required for chat)
GEMINI_API_KEY=AIza...your-key
GEMINI_MODEL=gemini-1.5-flash                     # or gemini-1.5-pro

# ChromaDB (vector store location)
CHROMA_PATH=./chroma_db                           # relative to where uvicorn runs
CHROMA_COLLECTION=rescue_arc_docs

# API auth (shared with Next.js frontend)
INTERNAL_API_KEY=dev-secret-key-change-in-production

# Embeddings (no key needed — runs locally)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## Dependency Summary (All Free)

| Package | Purpose | Cost |
|---|---|---|
| `langchain-google-genai` | Gemini LLM integration | Free (API key) |
| `chromadb` + `langchain-chroma` | Local vector store | Free (local) |
| `langchain-huggingface` + `sentence-transformers` | Local embeddings | Free (local) |
| `langchain` + `langchain-core` | RAG orchestration | Free (OSS) |
| `langchain-text-splitters` | Document chunking | Free (OSS) |
| `pypdf` | PDF text extraction | Free (OSS) |
| `pydantic-settings` | Config management | Free (OSS) |

---

## Verification Status

✅ All 6 RAG modules import cleanly  
✅ 5 DB tools reference real `habitations` + `regions` schema  
✅ ChromaDB persists to local `./chroma_db/` folder  
✅ Gemini 1.5 Flash with tool-calling configured  
✅ SSE streaming endpoint ready  
✅ File upload (PDF/txt/md) endpoint ready  
✅ Admin document list endpoint ready  
✅ Live DB context debug endpoint ready  
