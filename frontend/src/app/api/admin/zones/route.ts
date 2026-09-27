import { NextResponse } from "next/server";
import { getRecentZonesWithStatus, updateZoneAdminStatus } from "@/lib/data-service";

export async function GET() {
  try {
    const result = await getRecentZonesWithStatus();
    return NextResponse.json({
      zones: result.data,
      isFallback: result.isFallback,
      source: result.source,
      warning: result.warning,
    });
  } catch (error: any) {
    console.error("[API Admin Zones] GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to load zones" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { zoneId, name, population, isRedZone, zoneColor, worstHazard, worstScore, priority } = body;

    if (!zoneId) {
      return NextResponse.json({ error: "Missing required parameter: zoneId" }, { status: 400 });
    }

    const updatedZone = await updateZoneAdminStatus(zoneId, {
      name,
      population: population !== undefined ? Number(population) : undefined,
      isRedZone: isRedZone !== undefined ? Boolean(isRedZone) : undefined,
      zoneColor,
      worstHazard,
      worstScore: worstScore !== undefined ? Number(worstScore) : undefined,
      priority,
    });

    if (!updatedZone) {
      return NextResponse.json({ error: `Zone with ID '${zoneId}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Database updated: ${updatedZone.name} status saved successfully.`,
      zone: updatedZone,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API Admin Zones] PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update zone in database" },
      { status: 500 }
    );
  }
}
