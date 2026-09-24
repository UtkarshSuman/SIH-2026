# RAG System — Full Build Plan & Implementation Guide

## What We're Building

A **fully-functional Retrieval-Augmented Generation (RAG) chatbot** for the Rescue Arc platform that:

1. **Retrieves** semantically similar knowledge from a local vector store (ChromaDB — free, no cloud needed)
2. **Fetches live hazard data** directly from the PostGIS database (habitations, regions, zone risk)
3. **Generates answers** using **Google Gemini API** (free tier: 15 req/min, 1M tokens/day)
4. **Embeds documents** using `sentence-transformers` — fully local, zero cost, zero rate limit
5. **Streams responses** token-by-token over SSE to the frontend

---

## Why Switching from Existing Design

| Component | Existing (broken) | New (this plan) |
|---|---|---|
| LLM | Groq (API key not set) | **Gemini 1.5 Flash** (free tier) |
| Vector Store | PGVector on Render (needs pgvector extension) | **ChromaDB** (local SQLite-backed, zero setup) |
| Embeddings | HuggingFace (correct — keep) | HuggingFace `all-MiniLM-L6-v2` (kept) |
| DB Tools | Zone/ZoneStatus models (not in real schema) | **Real schema**: `habitations` + `regions` tables |
| Config | Incomplete Pydantic settings | Full Pydantic v2 settings with `.env` loading |
| Auth | X-API-Key header | Same (kept) |

---

## Architecture Diagram

```
User Question
      │
      ▼
┌─────────────────────────────────────────┐
│           FastAPI RAG Router             │
│  POST /api/v1/rag/chat  (SSE stream)    │
│  POST /api/v1/rag/ingest               │
│  GET  /api/v1/rag/documents            │
│  GET  /api/v1/rag/db-context           │  ← NEW: live DB dump
└────────────────┬────────────────────────┘
                 │
      ┌──────────▼──────────┐
      │   RAG Chain          │
      │  (chain.py)          │
      └──┬─────────┬─────────┘
         │         │
         ▼         ▼
   ┌──────────┐  ┌─────────────────────────┐
   │ChromaDB  │  │  DB Tool Calling        │
   │Vector    │  │  (tools.py)             │
   │Store     │  │  ┌───────────────────┐  │
   │(local    │  │  │get_zone_status()  │  │
   │SQLite)   │  │  │get_high_risk_     │  │
   └──────────┘  │  │  habitations()    │  │
                 │  │get_region_summary()│  │
                 │  └───────────────────┘  │
                 │         │               │
                 └─────────▼───────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostGIS DB   │
                    │ (Render)     │
                    │ habitations  │
                    │ regions      │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ Gemini 1.5  │
                    │ Flash API   │
                    │ (Free Tier) │
                    └─────────────┘
```

---

## Files to Create / Modify

### 1. `app/core/config.py` — [MODIFY]
Full Pydantic v2 settings class, loads from `.env`.

### 2. `app/rag/embeddings.py` — [MODIFY]
Keep HuggingFace local embeddings, add lazy singleton.

### 3. `app/rag/vector_store.py` — [REPLACE]
**Switch**: PGVector → **ChromaDB** (local, no server needed, persists to disk).

### 4. `app/rag/retriever.py` — [MODIFY]
Add PDF file ingestion support, fix chunk metadata.

### 5. `app/rag/tools.py` — [REPLACE]
**Fix all 3 tools** to use the real `habitations` + `regions` schema via psycopg2 (not ORM).

### 6. `app/rag/chain.py` — [REPLACE]
**Switch LLM**: Groq → **Gemini 1.5 Flash** via `langchain-google-genai`.

### 7. `app/rag/models.py` — [MINOR FIX]
Fix import path: `app.gis.database` → `app.rag.db`.

### 8. `app/rag/db.py` — [NEW]
Minimal SQLAlchemy engine/session pointing to the same Render PostgreSQL DB (reuses `backend/database.py`'s connection string).

### 9. `app/api/routes/rag.py` — [MODIFY]
Add `/rag/db-context` endpoint, add file upload support.

### 10. `app/schemas/rag.py` — [MODIFY]
Add `FileIngestRequest` and `DBContextResponse` schemas.

### 11. `requirements_rag.txt` — [NEW]
Pinned dependencies for the RAG system.

---

## Dependencies (All Free)

```
# LLM — Gemini (free tier: 15 rpm, 1M tokens/day)
langchain-google-genai>=2.0.0
google-generativeai>=0.8.0

# Vector Store — local ChromaDB (SQLite-backed, no cloud)
chromadb>=0.5.0
langchain-chroma>=0.1.0

# Embeddings — local sentence-transformers (no API, no cost)
sentence-transformers>=3.3.0
langchain-huggingface>=0.1.0

# LangChain core
langchain>=0.3.0
langchain-core>=0.3.0
langchain-community>=0.3.0

# Document loaders (PDF, text)
pypdf>=4.0.0
unstructured>=0.14.0

# DB
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
pydantic-settings>=2.0.0
sqlalchemy>=2.0.0
```

---

## Free API Keys Needed

| Service | Where to Get | Free Tier |
|---|---|---|
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com) → Get API Key | 15 req/min, 1M tokens/day |

Add to `.env`:
```
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
CHROMA_PATH=./chroma_db
INTERNAL_API_KEY=your-internal-key
```

---

## Real Database Schema (from existing codebase)

The tools must query these actual tables in the Render PostgreSQL DB:

```sql
-- habitations table (2607 rows)
SELECT id, name, region_id,
       zone_class,       -- 'red' | 'yellow' | 'green'
       hazard_prob,      -- 0.0 – 1.0
       evacuees,
       timeline,
       slope_class,
       rainfall_mm,
       discharge_cumecs,
       dist_river_m,
       isolation_index,
       dest_id           -- FK to safe destination habitation
FROM habitations;

-- regions table
SELECT region_id, display_name, slug, hazard_types
FROM regions;
```

---

## 5 RAG DB Tools to Implement

| Tool Name | Query | When LLM Uses It |
|---|---|---|
| `get_zone_status` | Filter habitations by name ILIKE | "What is the risk in Joshimath?" |
| `get_high_risk_habitations` | WHERE zone_class = 'red' + region filter | "Which villages are in the red zone?" |
| `get_region_summary` | GROUP BY region, count by zone_class | "Summarize risk in Wayanad" |
| `get_relocation_plan` | JOIN habitations h + dest h2 on dest_id | "Where will people from X be relocated?" |
| `get_all_active_regions` | SELECT from regions | "Which regions are monitored?" |

---

## Build Order (Step-by-Step)

### Phase 1: Core Infrastructure
1. Fix `app/core/config.py` → Pydantic Settings
2. Create `app/rag/db.py` → DB connection helper
3. Replace `app/rag/vector_store.py` → ChromaDB
4. Fix `app/rag/embeddings.py` → cached singleton

### Phase 2: LLM + Chain
5. Replace `app/rag/chain.py` → Gemini 1.5 Flash
6. Fix `app/rag/retriever.py` → ingest_text + ingest_file

### Phase 3: Live DB Tools
7. Replace `app/rag/tools.py` → 5 real-schema tools

### Phase 4: API Layer
8. Fix `app/schemas/rag.py`
9. Update `app/api/routes/rag.py` → add file upload + db-context endpoints

### Phase 5: Document Pre-loading
10. Write `app/rag/seed_documents.py` → pre-ingest project docs (WEIGHT_JUSTIFICATION.md, README, etc.)

---

## Testing the RAG System

```powershell
# 1. Start server
cd backend2/backend
uvicorn main:app --reload --port 8000

# 2. Ingest a document
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your-internal-key" \
  -H "Content-Type: application/json" \
  -d '{"title":"Rescue Arc Overview","sourceType":"text","content":"Rescue Arc classifies 2607 habitations into Red/Yellow/Green zones..."}'

# 3. Chat (live streaming)
curl -X POST http://localhost:8000/api/v1/rag/chat \
  -H "X-API-Key: your-internal-key" \
  -H "Content-Type: application/json" \
  -d '{"message":"Which villages in Wayanad are in the red zone?"}'

# 4. Check DB tools directly
curl http://localhost:8000/api/v1/rag/db-context?region=wayanad \
  -H "X-API-Key: your-internal-key"
```

---

## Expected Chat Capabilities After Build

| User Question | RAG Path |
|---|---|
| "What is AHP weighting?" | Vector store retrieval from ingested docs |
| "Which areas in Joshimath are high risk?" | `get_zone_status` tool → live DB query |
| "How many red-zone villages are in Wayanad?" | `get_region_summary` tool → live DB query |
| "Where will people from X be relocated?" | `get_relocation_plan` tool → live DB query |
| "Explain what slope class means" | Vector store retrieval |
| "List all monitored regions" | `get_all_active_regions` tool → live DB |
