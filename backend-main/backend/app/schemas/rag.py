"""app/schemas/rag.py — Pydantic request/response models for RAG endpoints."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's question")
    session_id: Optional[str] = Field(
        None, description="Optional session ID for future multi-turn support"
    )


class IngestRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Human-readable document title")
    sourceType: str = Field(
        "text",
        description="Document source type: 'text' for pasted content, 'file' for uploads",
    )
    content: str = Field(..., min_length=1, description="The full document text to ingest")


class IngestResponse(BaseModel):
    success: bool
    chunksCreated: int
    title: str
    error: Optional[str] = None


class DocumentRecord(BaseModel):
    id: str
    title: str
    sourceType: str
    chunkCount: int
    ingestedAt: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentRecord]
    total: int


class DBContextResponse(BaseModel):
    """Raw database context dump for inspection / debugging."""
    region: Optional[str]
    red_count: int
    yellow_count: int
    green_count: int
    top_red_zones: list[dict]
    regions_available: list[str]


class RelocationSuggestRequest(BaseModel):
    """Kept for backward compatibility with any existing callers."""
    pass