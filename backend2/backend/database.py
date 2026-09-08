import os
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir.parent / ".env")
load_dotenv(backend_dir.parent / ".env.local", override=False)

DB_URL = os.getenv("DB_URL") or os.getenv("DATABASE_URL")

def get_connection():
    if not DB_URL:
        raise RuntimeError("Database URL is not set in the environment variables.")
    return psycopg2.connect(DB_URL, connect_timeout=5)

