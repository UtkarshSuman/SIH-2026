"""
app/rag/vector_store.py — Vector store supporting both local ChromaDB and Supabase (pgvector).

Configurations (via .env):
  VECTOR_STORE_TYPE=chromadb   — Local ChromaDB SQLite file (default, no DB setup required)
  VECTOR_STORE_TYPE=supabase   — Supabase cloud PostgreSQL with pgvector extension

Supabase pgvector mode requires:
  - Supabase DB connection via DB_URL / DATABASE_URL
  - Vector extension enabled: 'CREATE EXTENSION IF NOT EXISTS vector;' (auto-initialized)
  - Table 'rag_documents' (auto-initialized)
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from langchain_core.documents import Document

from app.core.config import settings
from app.rag.embeddings import get_embeddings

logger = logging.getLogger(__name__)

_chroma_store = None
_supabase_store = None


# ──────────────────────────────────────────────────────────────────────────────
# Supabase pgvector Store implementation
# ──────────────────────────────────────────────────────────────────────────────
class SupabaseRetriever:
    """Lightweight retriever wrapper for SupabaseVectorStore."""

    def __init__(self, store: SupabaseVectorStore, k: int = 4):
        self.store = store
        self.k = k

    def invoke(self, input: str, **kwargs: Any) -> list[Document]:
        return self.store.similarity_search(input, k=self.k)

    async def ainvoke(self, input: str, **kwargs: Any) -> list[Document]:
        return self.store.similarity_search(input, k=self.k)


class SupabaseVectorStore:
    """
    Direct pgvector-backed vector store using psycopg2 and the existing DB connection.
    Zero external vector-store packages needed — stores directly in Supabase Postgres.
    """

    def __init__(self):
        self._table_initialized = False

    def _ensure_table(self) -> None:
        if self._table_initialized:
            return
        from app.rag.db import get_pg_connection

        conn = get_pg_connection()
        try:
            with conn.cursor() as cur:
                # 1. Enable pgvector extension
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                # 2. Ensure rag_documents table exists (384 dims for all-MiniLM-L6-v2)
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS rag_documents (
                        id TEXT PRIMARY KEY,
                        content TEXT NOT NULL,
                        metadata JSONB DEFAULT '{}'::jsonb,
                        embedding vector(384),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    """
                )
                # 3. Create index for fast cosine similarity search if table is ready
                try:
                    cur.execute(
                        """
                        CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
                        ON rag_documents USING ivfflat (embedding vector_cosine_ops)
                        WITH (lists = 100);
                        """
                    )
                except Exception:
                    # ivfflat requires rows or can be skipped in small databases
                    conn.rollback()
                else:
                    conn.commit()
            conn.commit()
            self._table_initialized = True
            logger.info("Supabase rag_documents table and pgvector verified.")
        except Exception as exc:
            logger.warning(f"Failed to auto-initialize Supabase vector table: {exc}")
            conn.rollback()
        finally:
            conn.close()

    def add_texts(self, texts: list[str], metadatas: list[dict] | None = None) -> list[str]:
        """Generate embeddings and insert chunks into Supabase rag_documents."""
        if not texts:
            return []
        self._ensure_table()
        from app.rag.db import get_pg_connection

        embeddings_model = get_embeddings()
        vectors = embeddings_model.embed_documents(texts)

        ids = [str(uuid.uuid4()) for _ in texts]
        metas = metadatas or [{}] * len(texts)

        conn = get_pg_connection()
        try:
            with conn.cursor() as cur:
                for doc_id, text, meta, vec in zip(ids, texts, metas, vectors):
                    cur.execute(
                        """
                        INSERT INTO rag_documents (id, content, metadata, embedding)
                        VALUES (%s, %s, %s::jsonb, %s::vector)
                        """,
                        (doc_id, text, json.dumps(meta), str(vec)),
                    )
            conn.commit()
            return ids
        except Exception as exc:
            conn.rollback()
            logger.error(f"Error inserting documents into Supabase: {exc}")
            raise
        finally:
            conn.close()

    def similarity_search(self, query: str, k: int = 4) -> list[Document]:
        """Perform cosine similarity vector search in Supabase."""
        self._ensure_table()
        from app.rag.db import get_pg_connection

        embeddings_model = get_embeddings()
        query_vector = embeddings_model.embed_query(query)

        conn = get_pg_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT content, metadata
                    FROM rag_documents
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (str(query_vector), k),
                )
                rows = cur.fetchall()
                return [
                    Document(page_content=r[0], metadata=r[1] if isinstance(r[1], dict) else {})
                    for r in rows
                ]
        except Exception as exc:
            logger.error(f"Error querying Supabase vectors: {exc}")
            return []
        finally:
            conn.close()

    def as_retriever(self, search_type: str = "similarity", search_kwargs: dict | None = None) -> SupabaseRetriever:
        kwargs = search_kwargs or {}
        k = kwargs.get("k", settings.rag_top_k)
        return SupabaseRetriever(store=self, k=k)


# ──────────────────────────────────────────────────────────────────────────────
# Vector Store Accessor
# ──────────────────────────────────────────────────────────────────────────────
def get_vector_store():
    """
    Returns the configured vector store:
    - If VECTOR_STORE_TYPE is 'supabase' or 'pgvector' -> SupabaseVectorStore
    - Otherwise -> Local ChromaDB store
    """
    global _chroma_store, _supabase_store

    store_type = settings.vector_store_type.strip().lower()

    if store_type in ("supabase", "pgvector"):
        if _supabase_store is None:
            _supabase_store = SupabaseVectorStore()
        return _supabase_store

    # Default to ChromaDB
    if _chroma_store is None:
        from langchain_chroma import Chroma

        _chroma_store = Chroma(
            collection_name=settings.chroma_collection,
            embedding_function=get_embeddings(),
            persist_directory=settings.chroma_path,
        )
    return _chroma_store


def reset_store() -> None:
    """Force re-initialization (e.g. for testing)."""
    global _chroma_store, _supabase_store
    _chroma_store = None
    _supabase_store = None