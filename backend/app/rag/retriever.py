"""
FEATURE: Two operations - ingest_text (chunk + embed + store a document)
and get_retriever (fetch the top-K most relevant chunks for a question).
INSTALLATION: pip install langchain
"""
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings
from app.rag.vector_store import get_vector_store


def ingest_text(text: str, metadata: dict) -> int:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size, chunk_overlap=settings.rag_chunk_overlap
    )
    chunks = splitter.split_text(text)
    store = get_vector_store()
    store.add_texts(texts=chunks, metadatas=[metadata] * len(chunks))
    return len(chunks)


def get_retriever():
    return get_vector_store().as_retriever(search_kwargs={"k": settings.rag_top_k})