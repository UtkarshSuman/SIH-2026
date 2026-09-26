/**
 * GET /api/alerts/zones
 * Returns the list of monitored zones from the alert backend or Supabase table.
 * Tries port 8000 first, then 8001, with reliable static fallback.
 */
import { NextResponse } from "next/server";

const DEFAULT_ENDPOINTS = [
  process.env.ALERT_API_BASE,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://127.0.0.1:8001",
].filter(Boolean) as string[];

const FALLBACK_ZONES = [
  { zone_id: "Z-KERALA-WAYANAD-01",        name: "Wayanad, Kerala",           hazard: "LANDSLIDE" },
  { zone_id: "Z-UTTARAKHAND-JOSHIMATH-01", name: "Joshimath, Uttarakhand",    hazard: "LANDSLIDE" },
  { zone_id: "Z-ODISHA-PURI-01",           name: "Puri, Odisha",              hazard: "EROSION" },
  { zone_id: "Z-BIHAR-PATNA-01",           name: "Patna, Bihar",              hazard: "FLOOD" },
  { zone_id: "Z-ASSAM-GUWAHATI-01",        name: "Guwahati, Assam",           hazard: "FLOOD" },
  { zone_id: "Z-KERALA-IDUKKI-01",         name: "Idukki, Kerala",            hazard: "LANDSLIDE" },
  { zone_id: "Z-TAMILNADU-NILGIRIS-01",    name: "Nilgiris, Tamil Nadu",       hazard: "LANDSLIDE" },
  { zone_id: "Z-WESTBENGAL-DARJEELING-01", name: "Darjeeling, West Bengal",    hazard: "LANDSLIDE" },
  { zone_id: "Z-ASSAM-DHEMAJI-01",         name: "Dhemaji-Lakhimpur, Assam",  hazard: "FLOOD" },
  { zone_id: "Z-GUJARAT-KUTCH-01",         name: "Kutch, Gujarat",            hazard: "EROSION" },
];

export async function GET() {
  for (const base of DEFAULT_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${base}/zones`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.zones && data.zones.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (_) {}
  }

  // Guaranteed fallback
  return NextResponse.json({ zones: FALLBACK_ZONES });
}
