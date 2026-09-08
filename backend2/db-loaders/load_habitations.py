"""
Bulk COPY-based version of load_habitations.py.

Same data sources and same end result as load_habitations.py, but uses
PostgreSQL's COPY command (via psycopg2 staging tables) instead of
row-by-row parameterized INSERTs/UPDATEs. Use this when loading a much
larger dataset than the current 2,607-habitation run, where COPY's
throughput matters.

Run order matters: regions -> habitations (base) -> zone_class safe pass -> relocation pass.

Prereq (run once in psql before this script, same as load_habitations.py):
    ALTER TABLE habitations ADD COLUMN source_id TEXT UNIQUE;

Usage:
    python load_habitations_bulk.py
"""

import io
import psycopg2
import pandas as pd

# ---- CONFIG: same as load_habitations.py, adjust connection string and file paths ----
DB_URL = "postgresql://rescue_arc_db_user:qP4JLFGXgUP4YMc2WpIUlDD6NTP9N7Bn@dpg-daejvson74is73e6ugl0-a.oregon-postgres.render.com/rescue_arc_db"
PREDICTIONS_CSV = r"C:\Projects\SIH-Project\DataSet\automated_dataSet\DataSet\combined_cleaned_dataset\combined_predictions.csv"
CARRYING_CAPACITY_CSV = r"C:\Projects\SIH-Project\DataSet\automated_dataSet\DataSet\combined_cleaned_dataset\destination_carrying_capacity.csv"
RELOCATION_PLAN_CSV = r"C:\Projects\SIH-Project\DataSet\automated_dataSet\DataSet\combined_cleaned_dataset\relocation_action_plan.csv"

REGION_DISPLAY_NAMES = {
    "joshimath_uttarakhand": "Joshimath, Uttarakhand",
    "wayanad_kerala": "Wayanad, Kerala",
    "idukki_kerala": "Idukki, Kerala",
    "nilgiris_tamilnadu": "Nilgiris, Tamil Nadu",
    "darjeeling_westbengal": "Darjeeling, West Bengal",
    "dhemaji_lakhimpur_assam": "Dhemaji-Lakhimpur, Assam",
    "kandhamal_rayagada_odisha": "Kandhamal-Rayagada, Odisha",
    "puri_odisha_coastal": "Puri Coastal, Odisha",
    "kutch_gujarat": "Kutch, Gujarat",
    "himachal_uttarakhand_himalaya": "Himachal-Uttarakhand Himalaya",
}


def df_to_copy_buffer(df: pd.DataFrame) -> io.StringIO:
    """Serialize a DataFrame to an in-memory CSV buffer for COPY FROM STDIN."""
    buf = io.StringIO()
    df.to_csv(buf, index=False, header=False, na_rep="")
    buf.seek(0)
    return buf


def load_regions(conn):
    print("Loading regions...")
    with conn.cursor() as cur:
        for key, display_name in REGION_DISPLAY_NAMES.items():
            cur.execute(
                """
                INSERT INTO regions (display_name)
                VALUES (%s)
                ON CONFLICT DO NOTHING
                """,
                (display_name,),
            )
        cur.execute("SELECT region_id, display_name FROM regions")
        name_to_id = {row[1]: row[0] for row in cur.fetchall()}
    return {key: name_to_id[name] for key, name in REGION_DISPLAY_NAMES.items()}


def load_base_habitations(conn, region_id_map):
    print("Bulk loading base habitations from combined_predictions.csv...")
    df = pd.read_csv(PREDICTIONS_CSV)

    df["zone_class"] = df["predicted_red_zone"].map({True: "red", False: "yellow"})
    df["region_id"] = df["region"].map(region_id_map)

    rows = df[
        [
            "full_id",
            "name",
            "region_id",
            "lon_wgs84",
            "lat_wgs84",
            "zone_class",
            "predicted_red_zone_prob",
            "slope_class",
            "rainfall_mm",
            "flood_risk_discharge_cumecs",
            "dist_to_river_m",
            "isolation_index",
        ]
    ].copy()
    rows.columns = [
        "source_id",
        "name",
        "region_id",
        "lon",
        "lat",
        "zone_class",
        "hazard_prob",
        "slope_class",
        "rainfall_mm",
        "discharge_cumecs",
        "dist_river_m",
        "isolation_index",
    ]
    rows["name"] = rows["name"].fillna("Unnamed Habitation")
    with conn.cursor() as cur:
        # Staging table: same columns, but lon/lat kept separate (geom built after COPY)
        cur.execute(
            """
            CREATE TEMP TABLE staging_habitations (
                source_id TEXT,
                name TEXT,
                region_id INTEGER,
                lon DOUBLE PRECISION,
                lat DOUBLE PRECISION,
                zone_class TEXT,
                hazard_prob DOUBLE PRECISION,
                slope_class INTEGER,
                rainfall_mm DOUBLE PRECISION,
                discharge_cumecs DOUBLE PRECISION,
                dist_river_m DOUBLE PRECISION,
                isolation_index DOUBLE PRECISION
            ) ON COMMIT DROP
            """
        )

        buf = df_to_copy_buffer(rows)
        cur.copy_expert(
            """
            COPY staging_habitations
                (source_id, name, region_id, lon, lat, zone_class, hazard_prob,
                 slope_class, rainfall_mm, discharge_cumecs, dist_river_m, isolation_index)
            FROM STDIN WITH (FORMAT csv, NULL '')
            """,
            buf,
        )

        cur.execute(
            """
            INSERT INTO habitations
                (source_id, name, region_id, geom, zone_class, hazard_prob,
                 slope_class, rainfall_mm, discharge_cumecs, dist_river_m, isolation_index)
            SELECT
                source_id, name, region_id,
                ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
                zone_class, hazard_prob, slope_class, rainfall_mm,
                discharge_cumecs, dist_river_m, isolation_index
            FROM staging_habitations
            ON CONFLICT (source_id) DO NOTHING
            """
        )
        print(f"  inserted up to {len(rows)} habitations (staged via COPY)")


def mark_safe_destinations(conn):
    print("Bulk marking viable destinations as safe...")
    df = pd.read_csv(CARRYING_CAPACITY_CSV)
    viable = df[df["is_viable_destination"] == True][["full_id"]].rename(
        columns={"full_id": "source_id"}
    )

    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TEMP TABLE staging_safe (
                source_id TEXT
            ) ON COMMIT DROP
            """
        )
        buf = df_to_copy_buffer(viable)
        cur.copy_expert(
            "COPY staging_safe (source_id) FROM STDIN WITH (FORMAT csv, NULL '')",
            buf,
        )
        cur.execute(
            """
            UPDATE habitations
            SET zone_class = 'safe'
            FROM staging_safe
            WHERE habitations.source_id = staging_safe.source_id
            """
        )
        print(f"  marked up to {len(viable)} habitations as safe (staged via COPY)")


def apply_relocation_plan(conn):
    print("Bulk applying relocation_action_plan.csv...")
    df = pd.read_csv(RELOCATION_PLAN_CSV)

    records = df[
        ["red_zone_id", "evacuee_population", "relocation_timeline", "assigned_destination_id"]
    ].rename(
        columns={
            "red_zone_id": "source_id",
            "evacuee_population": "evacuees",
            "relocation_timeline": "timeline",
            "assigned_destination_id": "dest_source_id",
        }
    )

    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TEMP TABLE staging_relocation (
                source_id TEXT,
                evacuees INTEGER,
                timeline TEXT,
                dest_source_id TEXT
            ) ON COMMIT DROP
            """
        )
        buf = df_to_copy_buffer(records)
        cur.copy_expert(
            """
            COPY staging_relocation (source_id, evacuees, timeline, dest_source_id)
            FROM STDIN WITH (FORMAT csv, NULL '')
            """,
            buf,
        )

        # Resolve dest_source_id -> habitations.id and apply in one bulk UPDATE...FROM
        cur.execute(
            """
            UPDATE habitations
            SET evacuees = s.evacuees,
                timeline = s.timeline,
                dest_id = dest.id
            FROM staging_relocation s
            LEFT JOIN habitations dest ON dest.source_id = s.dest_source_id
            WHERE habitations.source_id = s.source_id
            """
        )
        print(f"  updated up to {len(records)} red-zone habitations with relocation assignments (staged via COPY)")


def main():
    conn = psycopg2.connect(DB_URL)
    try:
        region_id_map = load_regions(conn)
        load_base_habitations(conn, region_id_map)
        mark_safe_destinations(conn)
        apply_relocation_plan(conn)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM habitations")
            total = cur.fetchone()[0]
            cur.execute("SELECT zone_class, count(*) FROM habitations GROUP BY zone_class")
            by_zone = cur.fetchall()
        print(f"\nTotal habitations loaded: {total}")
        for zone, count in by_zone:
            print(f"  {zone}: {count}")
        conn.close()


if __name__ == "__main__":
    main()