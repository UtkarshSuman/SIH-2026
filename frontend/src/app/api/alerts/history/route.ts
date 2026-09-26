/**
 * GET /api/alerts/history
 * Fetches recent alert broadcast logs from the backend.
 */
import { NextResponse } from "next/server";

const DEFAULT_ENDPOINTS = [
  process.env.ALERT_API_BASE,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://127.0.0.1:8001",
].filter(Boolean) as string[];

export async function GET() {
  for (const base of DEFAULT_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${base}/api/alerts/history`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}
  }

  // Fallback demo audit history
  return NextResponse.json({
    alerts: [
      {
        id: "demo-alert-1",
        zone_id: "Z-KERALA-WAYANAD-01",
        severity: "alert",
        from_color: "GREEN",
        to_color: "RED",
        sent_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        recipients_targeted: 14,
        recipients_delivered: 14,
      },
      {
        id: "demo-alert-2",
        zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
        severity: "warning",
        from_color: "GREEN",
        to_color: "YELLOW",
        sent_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        recipients_targeted: 9,
        recipients_delivered: 8,
      },
      {
        id: "demo-alert-3",
        zone_id: "Z-ODISHA-PURI-01",
        severity: "alert",
        from_color: "YELLOW",
        to_color: "RED",
        sent_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        recipients_targeted: 28,
        recipients_delivered: 27,
      },
    ],
  });
}
