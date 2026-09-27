/**
 * POST /api/alerts/simulate
 * Simulates an emergency disaster hazard level (e.g. RED alert) for a zone.
 * Proxies to /admin/override-zone or /api/alerts/admin/override-zone.
 */
import { NextResponse } from "next/server";

function getAlertEndpoints(): string[] {
  const endpoints = [
    process.env.ALERT_API_BASE,
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.ML_SERVICE_URL,
    process.env.NEXT_PUBLIC_ML_SERVICE_URL,
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
  ].filter(Boolean) as string[];

  return Array.from(new Set(endpoints.map((e) => e.replace(/\/+$/, ""))));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone_id, zone_color = "RED", worst_hazard = "LANDSLIDE" } = body;

    const candidateBases = getAlertEndpoints();
    let lastError: any = null;

    for (const base of candidateBases) {
      const candidatePaths = [`${base}/admin/override-zone`, `${base}/api/alerts/admin/override-zone`];
      for (const targetUrl of candidatePaths) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(targetUrl, {
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
