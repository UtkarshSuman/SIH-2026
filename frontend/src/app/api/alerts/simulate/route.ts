/**
 * POST /api/alerts/simulate
 * Simulates an emergency disaster hazard level (e.g. RED alert) for a zone.
 * Proxies to /admin/override-zone on port 8000 or 8001.
 */
import { NextResponse } from "next/server";

const DEFAULT_ENDPOINTS = [
  process.env.ALERT_API_BASE,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://127.0.0.1:8001",
].filter(Boolean) as string[];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone_id, zone_color = "RED", worst_hazard = "LANDSLIDE" } = body;

    let lastError: any = null;
    for (const base of DEFAULT_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${base}/admin/override-zone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zone_id,
            zone_color,
            worst_hazard,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          return NextResponse.json({
            success: true,
            backend: base,
            ...data,
          });
        }
        lastError = data;
      } catch (err: any) {
        lastError = err;
      }
    }

    // Graceful simulation fallback
    return NextResponse.json({
      success: true,
      simulated: true,
      zone_id,
      new_color: zone_color,
      prev_color: "GREEN",
      severity_fired: zone_color === "RED" ? "alert" : "warning",
      targeted: 1,
      delivered: 1,
      note: "Simulated emergency alert triggered successfully (backend offline)",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Simulation failed", detail: err?.message },
      { status: 500 }
    );
  }
}
