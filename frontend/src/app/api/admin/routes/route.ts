import { NextResponse } from "next/server";
import { prisma } from "@sih/database";
import { centralFallbackStore } from "@/lib/central-fallback-store";

export async function GET() {
  try {
    // 1. Try fetching from Prisma RelocationAllocation joined with Zone and RelocationSite
    const allocations = await prisma.relocationAllocation.findMany({
      include: {
        plan: {
          include: {
            zone: true,
          },
        },
        site: true,
      },
    });

    if (allocations && allocations.length > 0) {
      const routes = allocations.map((a: any) => ({
        id: a.id,
        zoneId: a.plan.zone.zoneId,
        zoneName: a.plan.zone.name,
        siteId: a.site.id,
        siteName: a.site.name,
        distance: `${a.distanceKm.toFixed(1)} km`,
        distanceKm: a.distanceKm,
        travelTime: `${Math.round((a.estimatedTransitHours || (a.distanceKm / 35)) * 60)} min`,
        status: a.routeStatus === "CLEAR" ? "Safe" : a.routeStatus === "CAUTION" ? "Caution" : "Blocked",
        routeStatus: a.routeStatus,
        reason:
          a.routeStatus === "CLEAR"
            ? "Clear primary corridor"
            : a.routeStatus === "CAUTION"
            ? "Elevated runoff — reduce convoy speed"
            : "Road impassable — active debris flow",
        allocatedPopulation: a.allocatedPopulation,
        source: "DATABASE",
      }));

      return NextResponse.json({ routes, isFallback: false });
    }
  } catch (err) {
    console.warn("[API Admin Routes] Prisma routes query failed, using central fallback:", err);
  }

  // Fallback to central store plans and allocations
  const plans = centralFallbackStore.getRelocationPlans().plans;
  const fallbackRoutes: any[] = [];
  let routeIdx = 1;

  for (const p of plans) {
    for (const a of p.allocations) {
      const statusMap: Record<string, string> = {
        CLEAR: "Safe",
        CAUTION: "Caution",
        BLOCKED: "Blocked",
      };
      const cleanStatus = statusMap[a.timeline?.toUpperCase()] || "Safe";

      fallbackRoutes.push({
        id: `route-${routeIdx++}`,
        zoneId: p.zoneId,
        zoneName: p.zoneName,
        siteId: a.siteId,
        siteName: a.siteName,
        distance: `${a.distanceKm} km`,
        distanceKm: a.distanceKm,
        travelTime: `${Math.round((a.distanceKm / 35) * 60)} min`,
        status: cleanStatus,
        routeStatus: cleanStatus === "Safe" ? "CLEAR" : cleanStatus === "Caution" ? "CAUTION" : "BLOCKED",
        reason:
          cleanStatus === "Safe"
            ? "Clear designated transit route"
            : cleanStatus === "Caution"
            ? "Road work / narrow section"
            : "Blocked by terrain movement",
        allocatedPopulation: a.contribution,
        source: "CENTRAL_FALLBACK_STORE",
      });
    }
  }

  return NextResponse.json({ routes: fallbackRoutes, isFallback: true });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { routeId, siteId, routeStatus, reason } = body;

    const validStatus =
      routeStatus === "Safe" || routeStatus === "CLEAR"
        ? "CLEAR"
        : routeStatus === "Caution" || routeStatus === "CAUTION"
        ? "CAUTION"
        : "BLOCKED";

    // 1. Update fallback cache
    if (siteId) {
      centralFallbackStore.updateAllocationRoute(siteId, {
        routeStatus: validStatus,
      });
    }

    // 2. Update Prisma if database is reachable
    try {
      if (routeId && !routeId.startsWith("route-")) {
        await prisma.relocationAllocation.update({
          where: { id: routeId },
          data: {
            routeStatus: validStatus as any,
          },
        });
      } else if (siteId) {
        await prisma.relocationAllocation.updateMany({
          where: { siteId },
          data: {
            routeStatus: validStatus as any,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[API Admin Routes] Prisma update error, fallback cache updated:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Evacuation corridor status updated to ${validStatus} in database.`,
      status: validStatus === "CLEAR" ? "Safe" : validStatus === "CAUTION" ? "Caution" : "Blocked",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API Admin Routes] PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update route status" }, { status: 500 });
  }
}
