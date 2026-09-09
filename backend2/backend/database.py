import os
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir.parent / ".env")
load_dotenv(backend_dir.parent / ".env.local", override=False)

DB_URL = os.getenv("DB_URL") or os.getenv("DATABASE_URL")

def get_connection():
    database_url = os.getenv("DB_URL") or os.getenv("DATABASE_URL") or DB_URL
    if not database_url:
        raise RuntimeError("Database URL is not set in the environment variables.")
    return psycopg2.connect(
        database_url,
        connect_timeout=5,
        sslmode=os.getenv("DB_SSLMODE", "require"),
    )

