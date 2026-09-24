"""
app/rag/tools.py — Live database tools the chatbot can call mid-conversation.

Every tool queries the REAL PostGIS schema:
  - habitations(id, name, region_id, zone_class, hazard_prob, evacuees,
                timeline, slope_class, rainfall_mm, discharge_cumecs,
                dist_river_m, isolation_index, dest_id)
  - regions(region_id, display_name, slug, hazard_types[])

The LLM decides which tool to call based on the user's question.
No guessing — if it needs live data, it calls a tool and gets real rows.

INSTALLATION: pip install langchain-core psycopg2-binary
"""
from __future__ import annotations

from langchain_core.tools import tool
from app.rag.db import get_pg_connection


# ──────────────────────────────────────────────────────────────────────────────
# Tool 1: Specific place / zone lookup
# ──────────────────────────────────────────────────────────────────────────────
@tool
def get_zone_status(zone_name: str) -> str:
    """Look up the CURRENT hazard zone classification (RED/YELLOW/GREEN) and
    risk details for a specific habitation or village by name.
    Use this whenever the user asks about a named place's current risk level,
    evacuation need, or relocation status — never guess this from documents."""
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT h.name, h.zone_class, h.hazard_prob, h.evacuees,
                   h.timeline, h.slope_class, h.rainfall_mm,
                   h.dist_river_m, r.display_name AS region_name,
                   d.name AS dest_name
            FROM habitations h
            LEFT JOIN regions r ON r.region_id = h.region_id
            LEFT JOIN habitations d ON d.id = h.dest_id
            WHERE h.name ILIKE %s
            LIMIT 5
            """,
            (f"%{zone_name}%",),
        )
        rows = cur.fetchall()
        if not rows:
            return (
                f"No habitation found matching '{zone_name}' in the database. "
                "Try a different spelling or use get_all_active_regions to see "
                "available regions."
            )
        lines = [f"Hazard status for places matching '{zone_name}':"]
        for row in rows:
            name, zone_class, prob, evacuees, timeline, slope, rain, dist, region, dest = row
            lines.append(
                f"\n• {name} ({region or 'unknown region'})"
                f"\n  Zone: {(zone_class or 'unclassified').upper()}"
                f"\n  Hazard probability: {prob:.2f}" if prob else f"\n  Zone: {(zone_class or 'unclassified').upper()}"
            )
            if evacuees:
                lines.append(f"  Evacuees: {evacuees:,}  |  Timeline: {timeline or 'N/A'}")
            if dist:
                lines.append(f"  Distance to river: {dist:.0f} m  |  Rainfall: {rain or 'N/A'} mm")
            if dest:
                lines.append(f"  Assigned relocation destination: {dest}")
        return "\n".join(lines)
    except Exception as exc:
        return f"Database error while looking up '{zone_name}': {exc}"
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Tool 2: High-risk habitations listing
# ──────────────────────────────────────────────────────────────────────────────
@tool
def get_high_risk_habitations(region_slug: str = "") -> str:
    """List all RED zone (highest risk) habitations, optionally filtered by
    region slug (e.g. 'wayanad', 'joshimath', 'darjeeling').
    Use for broad questions like 'which villages need immediate evacuation'
    or 'list all red zone areas in [region]'."""
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        if region_slug:
            cur.execute(
                """
                SELECT h.name, h.evacuees, h.timeline, r.display_name
                FROM habitations h
                JOIN regions r ON r.region_id = h.region_id
                WHERE h.zone_class = 'red' AND r.slug ILIKE %s
                ORDER BY h.hazard_prob DESC NULLS LAST
                LIMIT 20
                """,
                (f"%{region_slug}%",),
            )
        else:
            cur.execute(
                """
                SELECT h.name, h.evacuees, h.timeline, r.display_name
                FROM habitations h
                LEFT JOIN regions r ON r.region_id = h.region_id
                WHERE h.zone_class = 'red'
                ORDER BY h.hazard_prob DESC NULLS LAST
                LIMIT 20
                """
            )
        rows = cur.fetchall()
        if not rows:
            label = f"in '{region_slug}'" if region_slug else "overall"
            return f"No RED zone habitations found {label}."
        label = f"in {region_slug}" if region_slug else "across all regions"
        lines = [f"Top RED zone habitations {label} (up to 20):"]
        for name, evacuees, timeline, region in rows:
            evac_str = f"{evacuees:,} evacuees" if evacuees else "evacuee count unknown"
            tl_str = f"timeline: {timeline}" if timeline else ""
            lines.append(f"• {name} ({region or '?'}) — {evac_str}  {tl_str}".strip())
        return "\n".join(lines)
    except Exception as exc:
        return f"Database error: {exc}"
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Tool 3: Region-level summary statistics
# ──────────────────────────────────────────────────────────────────────────────
@tool
def get_region_summary(region_slug: str) -> str:
    """Get a risk summary for an entire region: count of Red/Yellow/Green
    habitations, total evacuees at risk, and hazard types monitored.
    Use for questions like 'summarise the situation in Wayanad' or
    'how many red zones are there in Joshimath?'"""
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT r.display_name, r.hazard_types,
                   COUNT(*) FILTER (WHERE h.zone_class = 'red')   AS red_count,
                   COUNT(*) FILTER (WHERE h.zone_class = 'yellow') AS yellow_count,
                   COUNT(*) FILTER (WHERE h.zone_class = 'green' OR h.zone_class IS NULL) AS green_count,
                   COALESCE(SUM(h.evacuees) FILTER (WHERE h.zone_class = 'red'), 0) AS red_evacuees
            FROM regions r
            LEFT JOIN habitations h ON h.region_id = r.region_id
            WHERE r.slug ILIKE %s OR r.display_name ILIKE %s
            GROUP BY r.display_name, r.hazard_types
            """,
            (f"%{region_slug}%", f"%{region_slug}%"),
        )
        row = cur.fetchone()
        if not row:
            return (
                f"No region found matching '{region_slug}'. "
                "Use get_all_active_regions() to see available region slugs."
            )
        display_name, hazard_types, red, yellow, green, red_evac = row
        hazards = ", ".join(hazard_types) if hazard_types else "N/A"
        return (
            f"Risk summary for {display_name}:\n"
            f"  🔴 Red zone:    {red} habitations  ({red_evac:,} evacuees at risk)\n"
            f"  🟡 Yellow zone: {yellow} habitations\n"
            f"  🟢 Green/Safe:  {green} habitations\n"
            f"  Monitored hazards: {hazards}"
        )
    except Exception as exc:
        return f"Database error: {exc}"
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Tool 4: Relocation plan for a specific habitation
# ──────────────────────────────────────────────────────────────────────────────
@tool
def get_relocation_plan(habitation_name: str) -> str:
    """Look up where people from a specific RED/YELLOW zone habitation are
    planned to be relocated. Returns the destination site name and distance.
    Use for 'where will people from X be relocated?' or 'what is the
    relocation plan for [village]?'"""
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT h.name, h.zone_class, h.evacuees, h.timeline,
                   d.name AS dest_name,
                   ROUND(
                     ST_Distance(h.geom::geography, d.geom::geography) / 1000.0, 1
                   ) AS dist_km
            FROM habitations h
            LEFT JOIN habitations d ON d.id = h.dest_id
            WHERE h.name ILIKE %s
            LIMIT 3
            """,
            (f"%{habitation_name}%",),
        )
        rows = cur.fetchall()
        if not rows:
            return f"No habitation found matching '{habitation_name}'."
        lines = []
        for name, zone_class, evacuees, timeline, dest, dist_km in rows:
            if not dest:
                lines.append(
                    f"• {name} ({(zone_class or 'unclassified').upper()}) — "
                    "no relocation destination assigned yet."
                )
            else:
                evac_str = f"{evacuees:,} people" if evacuees else "evacuee count unknown"
                dist_str = f" (~{dist_km} km away)" if dist_km else ""
                lines.append(
                    f"• {name} ({(zone_class or '?').upper()}) → "
                    f"{dest}{dist_str}\n"
                    f"  {evac_str} to relocate.  Timeline: {timeline or 'not specified'}"
                )
        return "\n".join(lines)
    except Exception as exc:
        # ST_Distance may fail if geom column not present — fallback gracefully
        return f"Relocation lookup error for '{habitation_name}': {exc}"
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Tool 5: List all monitored regions
# ──────────────────────────────────────────────────────────────────────────────
@tool
def get_all_active_regions() -> str:
    """List all disaster-prone regions being monitored by Rescue Arc, with
    their hazard types.  Use for 'which regions are covered?' or 'what areas
    does this system monitor?'"""
    conn = None
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT display_name, slug, hazard_types FROM regions ORDER BY display_name;"
        )
        rows = cur.fetchall()
        if not rows:
            return "No regions found in the database."
        lines = ["Regions monitored by Rescue Arc:"]
        for display_name, slug, hazard_types in rows:
            hazards = ", ".join(hazard_types) if hazard_types else "N/A"
            lines.append(f"• {display_name} (slug: {slug}) — hazards: {hazards}")
        return "\n".join(lines)
    except Exception as exc:
        return f"Database error: {exc}"
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
AVAILABLE_TOOLS = [
    get_zone_status,
    get_high_risk_habitations,
    get_region_summary,
    get_relocation_plan,
    get_all_active_regions,
]