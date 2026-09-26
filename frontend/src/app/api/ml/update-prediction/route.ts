import { NextResponse } from "next/server";
import { recordMLPrediction, getRecentZones } from "@/lib/data-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zoneId, hazardScores, metrics, source } = body;

    if (!zoneId || !hazardScores) {
      return NextResponse.json(
        { error: "zoneId and hazardScores are required" },
        { status: 400 }
      );
    }

    const updatedZone = await recordMLPrediction({
      zoneId,
      hazardScores: {
        FLOOD: Number(hazardScores.FLOOD ?? hazardScores.flood ?? 0),
        LANDSLIDE: Number(hazardScores.LANDSLIDE ?? hazardScores.landslide ?? 0),
        EROSION: Number(hazardScores.EROSION ?? hazardScores.erosion ?? 0),
        CLOUDBURST: Number(hazardScores.CLOUDBURST ?? hazardScores.cloudburst ?? 0),
      },
      metrics,
      source: source || "ml_service/inference",
    });

    if (!updatedZone) {
      return NextResponse.json({ error: `Zone ${zoneId} not found in database` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Recorded new ML prediction for ${updatedZone.name}`,
      zone: updatedZone,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record ML prediction" }, { status: 500 });
  }
}

export async function GET() {
  const zones = await getRecentZones();
  return NextResponse.json({
    status: "ML Prediction ingestion API active",
    zonesMonitored: zones.map((z) => ({
      zoneId: z.zoneId,
      name: z.name,
      worstScore: z.worstScore,
      worstHazard: z.worstHazard,
      zoneColor: z.zoneColor,
      lastAssessedAt: z.lastAssessedAt,
    })),
  });
}
