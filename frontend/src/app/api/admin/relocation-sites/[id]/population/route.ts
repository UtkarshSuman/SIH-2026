import { NextResponse } from "next/server";
import { updateRelocationSiteCapacity } from "@/lib/data-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();
    const population = Number(body.population ?? body.currentOccupancy);

    if (isNaN(population) || population < 0) {
      return NextResponse.json(
        { error: "Invalid population count provided" },
        { status: 400 }
      );
    }

    // Update in database with automatic central fallback store synchronization
    const finalSite = await updateRelocationSiteCapacity(siteId, {
      currentOccupancy: population,
    });

    if (!finalSite) {
      return NextResponse.json(
        { error: `Relocation site ${siteId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Population for ${finalSite.name} updated to ${population.toLocaleString()} occupants`,
      site: finalSite,
      isFullyOccupied:
        (finalSite.remainingCapacity ?? 0) <= 0 ||
        (finalSite.currentOccupancy ?? 0) >= (finalSite.capacity ?? 0),
    });
  } catch (err: any) {
    console.error("[API] Error updating relocation site population:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update population count" },
      { status: 500 }
    );
  }
}
