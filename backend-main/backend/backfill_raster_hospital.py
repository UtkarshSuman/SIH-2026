# backfill_raster_hospital.py
import csv
from psycopg2.extras import execute_values
from database import get_connection

def backfill(csv_path="combined_master.csv"):
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            raster_mean = float(r["raster_mean"]) if r["raster_mean"] not in ("", None) else None
            dist_hosp = float(r["dist_to_hospital_m"]) if r["dist_to_hospital_m"] not in ("", None) else None
            rows.append((r["full_id"], raster_mean, dist_hosp))
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("ALTER TABLE habitations ADD COLUMN IF NOT EXISTS raster_mean double precision;")
    cur.execute("ALTER TABLE habitations ADD COLUMN IF NOT EXISTS dist_hospital_m double precision;")

    execute_values(cur, """
        UPDATE habitations AS h
        SET raster_mean = v.raster_mean,
            dist_hospital_m = v.dist_hospital_m
        FROM (VALUES %s) AS v(source_id, raster_mean, dist_hospital_m)
        WHERE h.source_id = v.source_id;
    """, rows)

    conn.commit()
    print(f"Backfilled {cur.rowcount} rows.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    backfill(csv_path="combined_cleaned_dataset/combined_master.csv")