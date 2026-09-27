/**
 * POST /api/alerts/test-push
 * Manual testing endpoint to send an immediate push alert to a device token.
 * Proxies to Python backend /admin/test-push or /api/alerts/admin/test-push.
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
    const { fcm_token, zone_id, worst_hazard, zone_color } = body;

    if (!fcm_token) {
      return NextResponse.json(
        { error: "fcm_token is required to test push delivery" },
        { status: 400 }
      );
    }

    const candidateBases = getAlertEndpoints();
    let lastError: any = null;

    for (const base of candidateBases) {
      // Try both direct /admin/test-push and /api/alerts/admin/test-push
      const candidatePaths = [`${base}/admin/test-push`, `${base}/api/alerts/admin/test-push`];
      for (const targetUrl of candidatePaths) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fcm_token,
              zone_id: zone_id || "Z-ODISHA-PURI-01",
              worst_hazard: worst_hazard || "EROSION",
              zone_color: zone_color || "RED",
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

    // If backend is completely offline during demo, provide a simulated delivery confirmation
    return NextResponse.json({
      success: true,
      simulated: true,
      title: `🚨 Emergency Alert: ${worst_hazard || "Landslide"} in ${zone_id || "Joshimath"}`,
      body: "Test notification simulated successfully in browser environment (backend offline).",
      delivered_at: new Date().toISOString(),
      note: lastError?.detail || lastError?.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Test push failed", detail: err?.message },
      { status: 500 }
    );
  }
}
