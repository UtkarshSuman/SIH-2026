import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\utkar\SIH\sih-main\backend-main\.env.local")
db_url = os.environ.get("DB_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute('SELECT id, "siteCode", name, district, lat, lng, "sphereCapacity", "remainingCapacity", status FROM "RelocationSite" LIMIT 5;')
print("Sample Relocation Sites:")
for r in cur.fetchall():
    print(" ", r)

cur.execute('SELECT "zoneId", name, "zoneColor", "worstScore", "worstHazard", "priorityScore" FROM "Zone" WHERE "zoneColor" IN (\'RED\', \'YELLOW\');')
print("\nActive RED and YELLOW zones:")
for r in cur.fetchall():
    print(" ", r)

conn.close()
