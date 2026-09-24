from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.environ["DATABASE_URL"])

with engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT region_id, display_name FROM regions ORDER BY display_name"
    )).mappings().all()
    for row in rows:
        print(f"{row['region_id']}  |  {row['display_name']}")