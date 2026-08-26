"""
FEATURE: Two endpoints - /rag/chat (streams an answer) and /rag/ingest
(adds a document to the knowledge base). Ingestion here only accepts raw
text for now - add PDF/URL extraction (pypdf, trafilatura) when a
teammate builds that out.
INSTALLATION: none beyond rag/chain.py and rag/retriever.py.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import verify_api_key
from app.rag.chain import stream_rag_answer
from app.rag.retriever import ingest_text
from app.schemas.rag import ChatRequest, IngestRequest

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/rag/chat")
async def rag_chat(req: ChatRequest):
    async def event_stream():
        async for token in stream_rag_answer(req.message):
            yield token

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/rag/ingest")
async def rag_ingest(req: IngestRequest):
    count = ingest_text(req.content, metadata={"title": req.title})
    return {"success": True, "chunksCreated": count}