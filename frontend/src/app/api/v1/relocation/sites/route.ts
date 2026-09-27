import { NextResponse } from "next/server";
import { getRecentRelocationSitesWithStatus } from "@/lib/data-service";
import { FALLBACK_WARNING_MESSAGE } from "@/lib/central-fallback-store";

export async function GET() {
  try {
    const res = await getRecentRelocationSitesWithStatus();
    const response = NextResponse.json({
      sites: res.data,
      isFallback: res.isFallback,
      warning: res.isFallback ? FALLBACK_WARNING_MESSAGE : undefined,
    });
    if (res.isFallback) {
      response.headers.set("x-is-fallback", "true");
      response.headers.set("x-fallback-warning", FALLBACK_WARNING_MESSAGE);
    }
    return response;
  } catch (error) {
    console.error("Failed to load relocation sites", error);
    return NextResponse.json(
      { error: "Unable to load relocation sites from the database", sites: [] },
      { status: 500 }
    );
  }
}
