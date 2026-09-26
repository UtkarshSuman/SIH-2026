/**
 * GET /api/alerts/zones
 * Returns the list of monitored zones from the alert_service Supabase table.
 * Proxies to the Python alert_service GET /zones endpoint.
 */
import { NextResponse } from "next/server";

const ALERT_API = process.env.ALERT_API_BASE ?? "http://localhost:8001";

export async function GET() {
  try {
    const res = await fetch(`${ALERT_API}/zones`, {
      next: { revalidate: 60 }, // cache for 1 minute
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/alerts/zones] proxy error:", err);
    // Fallback: return the 10 known zones so the UI still shows the selector
    return NextResponse.json({
      zones: [
        { zone_id: "Z-UTTARAKHAND-JOSHIMATH-01", name: "Joshimath, Uttarakhand" },
        { zone_id: "Z-KERALA-WAYANAD-01",        name: "Wayanad, Kerala" },
        { zone_id: "Z-KERALA-IDUKKI-01",         name: "Idukki, Kerala" },
        { zone_id: "Z-TAMILNADU-NILGIRIS-01",    name: "Nilgiris, Tamil Nadu" },
        { zone_id: "Z-WESTBENGAL-DARJEELING-01", name: "Darjeeling, West Bengal" },
        { zone_id: "Z-ASSAM-DHEMAJI-01",         name: "Dhemaji-Lakhimpur, Assam" },
        { zone_id: "Z-ODISHA-PURI-01",           name: "Puri, Odisha" },
        { zone_id: "Z-GUJARAT-KUTCH-01",         name: "Kutch, Gujarat" },
        { zone_id: "Z-BIHAR-PATNA-01",           name: "Patna, Bihar" },
        { zone_id: "Z-ASSAM-GUWAHATI-01",        name: "Guwahati, Assam" },
      ],
    });
  }
}
