from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.environ["DATABASE_URL"])

with open("migrate_add_alert_column.sql") as f:
    sql = f.read()

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()

print("Migration applied")