"""
FEATURE: Connects LangChain to the pgvector-enabled Supabase database,
using the LOCAL embedding model instead of a paid API. The model is
cached at module level so it only loads into memory once per server
process, not once per request.
INSTALLATION: pip install langchain-huggingface sentence-transformers
"""
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import PGVector
from app.core.config import settings

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.embedding_model)
    return _embeddings


def get_vector_store(collection_name: str = "sih_documents"):
    return PGVector(
        connection_string=settings.database_url.replace("postgresql://", "postgresql+psycopg2://"),
        embedding_function=get_embeddings(),
        collection_name=collection_name,
    )