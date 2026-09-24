"""
app/core/config.py — Pydantic v2 Settings for the entire backend.

All values are loaded from environment variables / .env file.
Every component imports `settings` from here — no scattered os.getenv() calls.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Resolve the .env file relative to this package's root (backend2/ directory)
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"
_ENV_LOCAL = Path(__file__).resolve().parents[3] / ".env.local"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(_ENV_FILE), str(_ENV_LOCAL)],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    db_url: str = ""            # DB_URL in .env
    database_url: str = ""      # DATABASE_URL fallback

    @property
    def pg_url(self) -> str:
        """Returns the first non-empty DB URL available."""
        return self.db_url or self.database_url

    # ── LLM — Gemini (free tier) ──────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── Embeddings — local HuggingFace (no cost, no rate limit) ──────────────
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ── Vector Store — local ChromaDB or Supabase pgvector ───────────────────
    vector_store_type: str = "chromadb"   # "chromadb" | "supabase" | "pgvector"
    chroma_path: str = "./chroma_db"
    chroma_collection: str = "rescue_arc_docs"

    # ── RAG chunking ──────────────────────────────────────────────────────────
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 150
    rag_top_k: int = 4

    # ── Internal auth ─────────────────────────────────────────────────────────
    internal_api_key: str = "dev-key"

    # ── Legacy Groq (kept for backward compat, not used by new chain) ─────────
    groq_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"


settings = Settings()