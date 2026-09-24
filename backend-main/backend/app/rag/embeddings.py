"""
app/rag/embeddings.py — Local HuggingFace sentence-transformers embeddings.

Runs entirely on-device: no API key, no cost, no rate limit.
The model (~22 MB) is downloaded once by sentence-transformers and then
cached in ~/.cache/huggingface/.

INSTALLATION: pip install langchain-huggingface sentence-transformers
"""
from __future__ import annotations

from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings

_embeddings: HuggingFaceEmbeddings | None = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Singleton — loads the model once per process, never per request."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},       # CPU is fine for 384-dim model
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings