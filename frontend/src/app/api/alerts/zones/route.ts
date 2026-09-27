import { NextResponse } from "next/server";
import { getRecentZonesWithStatus } from "@/lib/data-service";
import { centralFallbackStore, FALLBACK_WARNING_MESSAGE } from "@/lib/central-fallback-store";

const DEFAULT_ENDPOINTS = [
  process.env.ALERT_API_BASE,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://127.0.0.1:8001",
].filter(Boolean) as string[];

export async function GET() {
  // 1. Try FastAPI Alert Service endpoint first
  for (const base of DEFAULT_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${base}/zones`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.zones && data.zones.length > 0) {
          return NextResponse.json({
            zones: data.zones,
            isFallback: false,
            source: "ALERT_BACKEND_API",
          });
        }
      }
    } catch (_) {}
  }

  // 2. Try PostgreSQL via Prisma
  try {
    const zonesRes = await getRecentZonesWithStatus();
    if (!zonesRes.isFallback && zonesRes.data && zonesRes.data.length > 0) {
      return NextResponse.json({
        zones: zonesRes.data.map((z) => ({
          zone_id: z.zoneId,
          name: z.name,
          hazard: z.worstHazard || "LANDSLIDE",
          color: z.zoneColor,
          district: z.district,
          state: z.state,
        })),
        isFallback: false,
        source: "DATABASE",
      });
    }
  } catch (_) {}

  // 3. Centralized Fallback Store
  const fallback = centralFallbackStore.getAlertZones();
  const response = NextResponse.json({
    zones: fallback.zones,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  });
  response.headers.set("x-is-fallback", "true");
  response.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
  return response;
}
