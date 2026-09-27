import { NextResponse } from "next/server";
import { getRecentZonesWithStatus } from "@/lib/data-service";
import { FALLBACK_WARNING_MESSAGE } from "@/lib/central-fallback-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("id");
    const query = searchParams.get("query")?.toLowerCase();
    const format = searchParams.get("format");

    const result = await getRecentZonesWithStatus();
    let zones = result.data;

    if (zoneId) {
      const found = zones.find((z) => z.zoneId.toLowerCase() === zoneId.toLowerCase());
      if (!found) return NextResponse.json({ error: "Zone not found" }, { status: 404 });
      const res = NextResponse.json(found);
      if (result.isFallback) {
        res.headers.set("x-is-fallback", "true");
        res.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
      }
      return res;
    }

    if (query) {
      zones = zones.filter(
        (z) =>
          z.name.toLowerCase().includes(query) ||
          z.district.toLowerCase().includes(query) ||
          z.state.toLowerCase().includes(query) ||
          z.zoneId.toLowerCase().includes(query)
      );
    }

    // Detailed object format if requested
    if (format === "details" || format === "object") {
      const res = NextResponse.json({
        zones,
        isFallback: result.isFallback,
        warning: result.isFallback ? FALLBACK_WARNING_MESSAGE : undefined,
        source: result.source || (result.isFallback ? "CENTRAL_FALLBACK_STORE" : "DATABASE"),
      });
      res.headers.set("Access-Control-Expose-Headers", "x-is-fallback, x-fallback-warning, x-source");
      if (result.isFallback) {
        res.headers.set("x-is-fallback", "true");
        res.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
        res.headers.set("x-source", result.source || "CENTRAL_FALLBACK_STORE");
      }
      return res;
    }

    // Standard array format with fallback metadata in response headers
    const res = NextResponse.json(zones);
    res.headers.set("Access-Control-Expose-Headers", "x-is-fallback, x-fallback-warning, x-source");
    if (result.isFallback) {
      res.headers.set("x-is-fallback", "true");
      res.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
      res.headers.set("x-source", result.source || "CENTRAL_FALLBACK_STORE");
    }
    return res;
  } catch (error) {
    console.error("Failed to load zones", error);
    return NextResponse.json({ error: "Unable to load zones from the database" }, { status: 500 });
  }
}
