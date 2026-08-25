"""
FEATURE: Centralized settings, loaded once from environment variables.
Every other file imports `settings` from here instead of reading
os.environ directly.
INSTALLATION: pip install pydantic-settings python-dotenv
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    internal_api_key: str = "internal-shared-secret-change-me"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()