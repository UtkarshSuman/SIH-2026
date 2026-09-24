"""
app/api/routes/rag.py — FastAPI routes for the RAG chatbot system.

Endpoints:
  POST /api/v1/rag/chat         — SSE streaming answer (retrieve + tool call)
  POST /api/v1/rag/ingest       — Ingest text document into ChromaDB
  POST /api/v1/rag/ingest-file  — Ingest PDF / .txt / .md file upload
  GET  /api/v1/rag/documents    — List all ingested documents
  GET  /api/v1/rag/db-context   — Live DB dump for a region (debug/inspection)

All routes require the X-API-Key header (set INTERNAL_API_KEY in .env).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile, File, Query
from fastapi.responses import StreamingResponse

from app.api.deps import verify_api_key
from app.rag.chain import stream_rag_answer
from app.rag.retriever import ingest_text, ingest_file
from app.rag.models import RagDocumentLog, SessionLocal, ensure_table
from app.rag.db import get_pg_connection
from app.schemas.rag import (
    ChatRequest,
    IngestRequest,
    IngestResponse,
    DocumentListResponse,
    DocumentRecord,
    DBContextResponse,
)

router = APIRouter(dependencies=[Depends(verify_api_key)])


# ──────────────────────────────────────────────────────────────────────────────
# POST /rag/chat — SSE streaming
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/rag/chat")
async def rag_chat(req: ChatRequest):
    """
    Stream a RAG-powered answer.

    The response is Server-Sent Events (text/event-stream).
    Each chunk is a raw string token from Gemini.
    Frontend should consume with EventSource or fetch + ReadableStream.
    """
    async def _event_stream():
        async for token in stream_rag_answer(req.message):
            # SSE format: "data: <token>\n\n"
            # Sending raw text so the frontend can reconstruct however it likes
            yield token

    return StreamingResponse(_event_stream(), media_type="text/event-stream")


# ──────────────────────────────────────────────────────────────────────────────
# POST /rag/ingest — text paste
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/rag/ingest", response_model=IngestResponse)
async def rag_ingest(req: IngestRequest):
    """Ingest a pasted text document into the ChromaDB vector store."""
    if not req.content.strip():
        return IngestResponse(success=False, chunksCreated=0, title=req.title, error="content is empty")

    chunk_count = ingest_text(
        req.content,
        metadata={"title": req.title, "sourceType": req.sourceType},
    )

    _log_document(title=req.title, source_type=req.sourceType, chunk_count=chunk_count)
    return IngestResponse(success=True, chunksCreated=chunk_count, title=req.title)


# ──────────────────────────────────────────────────────────────────────────────
# POST /rag/ingest-file — file upload (PDF, txt, md)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/rag/ingest-file", response_model=IngestResponse)
async def rag_ingest_file(file: UploadFile = File(...)):
    """
    Upload a PDF, .txt, or .md file and ingest its text into ChromaDB.

    curl example:
      curl -X POST http://localhost:8000/api/v1/rag/ingest-file \\
           -H "X-API-Key: your-key" \\
           -F "file=@/path/to/document.pdf"
    """
    file_bytes = await file.read()
    filename = file.filename or "upload"
    title = filename.rsplit(".", 1)[0]  # strip extension for display

    try:
        chunk_count = ingest_file(
            file_bytes,
            filename=filename,
            metadata={"title": title, "sourceType": "file", "filename": filename},
        )
    except ValueError as exc:
        return IngestResponse(success=False, chunksCreated=0, title=title, error=str(exc))

    _log_document(title=title, source_type="file", chunk_count=chunk_count)
    return IngestResponse(success=True, chunksCreated=chunk_count, title=title)


# ──────────────────────────────────────────────────────────────────────────────
# GET /rag/documents — admin: list ingested docs
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/rag/documents", response_model=DocumentListResponse)
async def list_rag_documents():
    """List all documents ingested into the vector store (admin dashboard)."""
    if SessionLocal is None:
        return DocumentListResponse(documents=[], total=0)

    try:
        db = SessionLocal()
        docs = (
            db.query(RagDocumentLog)
            .order_by(RagDocumentLog.ingested_at.desc())
            .all()
        )
        records = [
            DocumentRecord(
                id=d.id,
                title=d.title,
                sourceType=d.source_type,
                chunkCount=d.chunk_count,
                ingestedAt=d.ingested_at.isoformat(),
            )
            for d in docs
        ]
        return DocumentListResponse(documents=records, total=len(records))
    except Exception:
        return DocumentListResponse(documents=[], total=0)
    finally:
        if 'db' in locals() and db:
            db.close()


# ──────────────────────────────────────────────────────────────────────────────
# GET /rag/db-context — live DB dump for debugging / inspection
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/rag/db-context", response_model=DBContextResponse)
async def rag_db_context(region: str = Query(default="", description="Region slug to filter (empty = all)")):
    """
    Returns a live snapshot of hazard zone counts and top RED-zone habitations
    from the PostGIS database.  Useful for testing tool connectivity.
    """
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()

        # Zone counts
        if region:
            cur.execute(
                """
                SELECT
                  COUNT(*) FILTER (WHERE h.zone_class = 'red')    AS red,
                  COUNT(*) FILTER (WHERE h.zone_class = 'yellow') AS yellow,
                  COUNT(*) FILTER (WHERE h.zone_class NOT IN ('red','yellow') OR h.zone_class IS NULL) AS green
                FROM habitations h
                JOIN regions r ON r.region_id = h.region_id
                WHERE r.slug ILIKE %s
                """,
                (f"%{region}%",),
            )
        else:
            cur.execute(
                """
                SELECT
                  COUNT(*) FILTER (WHERE zone_class = 'red')    AS red,
                  COUNT(*) FILTER (WHERE zone_class = 'yellow') AS yellow,
                  COUNT(*) FILTER (WHERE zone_class NOT IN ('red','yellow') OR zone_class IS NULL) AS green
                FROM habitations
                """
            )
        counts = cur.fetchone()
        red_count, yellow_count, green_count = (counts or (0, 0, 0))

        # Top 10 red-zone habitations
        if region:
            cur.execute(
                """
                SELECT h.name, h.evacuees, r.display_name
                FROM habitations h
                JOIN regions r ON r.region_id = h.region_id
                WHERE h.zone_class = 'red' AND r.slug ILIKE %s
                ORDER BY h.hazard_prob DESC NULLS LAST LIMIT 10
                """,
                (f"%{region}%",),
            )
        else:
            cur.execute(
                """
                SELECT h.name, h.evacuees, r.display_name
                FROM habitations h
                LEFT JOIN regions r ON r.region_id = h.region_id
                WHERE h.zone_class = 'red'
                ORDER BY h.hazard_prob DESC NULLS LAST LIMIT 10
                """
            )
        top_red = [
            {"name": r[0], "evacuees": r[1], "region": r[2]}
            for r in cur.fetchall()
        ]

        # All regions
        cur.execute("SELECT slug FROM regions ORDER BY display_name;")
        regions_available = [r[0] for r in cur.fetchall()]

        return DBContextResponse(
            region=region or None,
            red_count=red_count,
            yellow_count=yellow_count,
            green_count=green_count,
            top_red_zones=top_red,
            regions_available=regions_available,
        )
    except Exception as exc:
        return DBContextResponse(
            region=region or None,
            red_count=0, yellow_count=0, green_count=0,
            top_red_zones=[{"error": str(exc)}],
            regions_available=[],
        )
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Private helpers
# ──────────────────────────────────────────────────────────────────────────────
def _log_document(title: str, source_type: str, chunk_count: int) -> None:
    """Write an ingestion log entry to rag_document_log (best-effort)."""
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