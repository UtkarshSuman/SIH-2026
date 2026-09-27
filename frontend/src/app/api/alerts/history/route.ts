/**
 * GET /api/alerts/history
 * Fetches recent alert broadcast logs from the backend or central fallback store.
 */
import { NextResponse } from "next/server";
import { centralFallbackStore, FALLBACK_WARNING_MESSAGE } from "@/lib/central-fallback-store";

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
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${base}/api/alerts/history`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          alerts: data.alerts || data,
          isFallback: false,
          source: "ALERT_BACKEND_API",
        });
      }
    } catch (_) {}
  }

  // Centralized Fallback Store
  const fallback = centralFallbackStore.getFallbackAlertHistory();
  const response = NextResponse.json({
    alerts: fallback.alerts,
    isFallback: true,
    warning: fallback.warning || FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  });
  response.headers.set("x-is-fallback", "true");
  response.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
  return response;
}
