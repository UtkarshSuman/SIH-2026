import { NextResponse } from "next/server";

const BACKEND_ENDPOINTS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  process.env.BACKEND_API_BASE,
  process.env.BACKEND2_URL,
].filter(Boolean) as string[];


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon") || searchParams.get("lng");
  const radiusKm = searchParams.get("radius_km") || "5.0";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing latitude or longitude parameter" },
      { status: 400 }
    );
  }

  let lastError: any = null;
  for (const base of BACKEND_ENDPOINTS) {
    try {
      const url = `${base}/api/analyze-point?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for multi-hazard API fetch

      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      const errText = await res.text();
      lastError = new Error(`Backend responded ${res.status}: ${errText}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error("[/api/analyze-point] All backend endpoints failed:", lastError);
  return NextResponse.json(
    {
      error: "Failed to analyze point. Backend GIS service unreachable or timed out.",
      detail: lastError?.message,
    },
    { status: 502 }
  );
}
