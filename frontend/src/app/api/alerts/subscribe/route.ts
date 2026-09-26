/**
 * POST /api/alerts/subscribe
 * Proxies subscriber registration to the Python alert_service backend (port 8001).
 * Accepts: { fcm_token, lat, lon, zone_id? }
 */
import { NextResponse } from "next/server";

const ALERT_API = process.env.ALERT_API_BASE ?? "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${ALERT_API}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/alerts/subscribe] proxy error:", err);
    return NextResponse.json(
      { error: "Alert backend unreachable. Is the Python alert service running on port 8001?" },
      { status: 502 }
    );
  }
}
