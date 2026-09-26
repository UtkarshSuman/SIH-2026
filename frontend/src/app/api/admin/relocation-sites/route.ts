import { NextResponse } from "next/server";
import { getRecentRelocationSites, updateRelocationSiteCapacity } from "@/lib/data-service";

export async function GET() {
  const sites = await getRecentRelocationSites();
  return NextResponse.json({ sites });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { siteId, capacity, usableAreaSqm, currentOccupancy, status, waterSourceType, roadConnectivityRating } = body;

    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    const updated = await updateRelocationSiteCapacity(siteId, {
      capacity,
      usableAreaSqm,
      currentOccupancy,
      status,
      waterSourceType,
      roadConnectivityRating,
    });

    if (!updated) {
      return NextResponse.json({ error: "Relocation site not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Carrying capacity updated for ${updated.name}`,
      site: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update relocation site" }, { status: 500 });
  }
}
