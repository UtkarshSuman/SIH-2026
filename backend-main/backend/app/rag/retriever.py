"""
app/rag/retriever.py — Ingest documents into the vector store and retrieve
relevant chunks for a given question.

Two ingest paths:
  - ingest_text(text, metadata)  — raw text string (admin UI paste)
  - ingest_file(file_bytes, filename, metadata)  — PDF or .txt upload

INSTALLATION: pip install langchain pypdf
"""
from __future__ import annotations

import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.core.config import settings
from app.rag.vector_store import get_vector_store


def _make_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def ingest_text(text: str, metadata: dict) -> int:
    """
    Split `text` into overlapping chunks, embed each, and store in ChromaDB.
    Returns the number of chunks created.
    """
    splitter = _make_splitter()
    chunks = splitter.split_text(text)
    if not chunks:
        return 0
    store = get_vector_store()
    store.add_texts(texts=chunks, metadatas=[metadata] * len(chunks))
    return len(chunks)


def ingest_file(file_bytes: bytes, filename: str, metadata: dict) -> int:
    """
    Detect file type by extension and extract text, then ingest.
    Supported: .pdf, .txt, .md
    Returns the number of chunks created.
    """
    fname_lower = filename.lower()
    if fname_lower.endswith(".pdf"):
        text = _extract_pdf(file_bytes)
    elif fname_lower.endswith((".txt", ".md")):
        text = file_bytes.decode("utf-8", errors="replace")
    else:
        raise ValueError(
            f"Unsupported file type: {filename}. Supported: .pdf, .txt, .md"
        )
    metadata["filename"] = filename
    return ingest_text(text, metadata)


def _extract_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF's pages using pypdf."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise ImportError(
            "pypdf is required for PDF ingestion. "
            "Install it: pip install pypdf"
        ) from exc

    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def get_retriever():
    """Return a LangChain retriever over the ChromaDB collection."""
    return get_vector_store().as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.rag_top_k},
    )