"""
FEATURE: Centralized settings - configured for a fully free RAG stack:
local Hugging Face sentence-transformers embeddings (no API key, runs on
your own machine, no cost, no rate limit) + Groq's free-tier LLM API for
generation.
INSTALLATION: pip install -r requirements.txt
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    internal_api_key: str = "internal-shared-secret-change-me"
    database_url: str = ""

    # Groq (free-tier LLM inference) - https://console.groq.com
    groq_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"

    # Local embeddings (Hugging Face sentence-transformers) - runs
    # on-device, no API key, no cost, no rate limit.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 150
    rag_top_k: int = 4


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()