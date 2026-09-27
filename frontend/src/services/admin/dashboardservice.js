import { mocklocations } from "@/data/mocklocations";
import { mockdashboardstats } from "@/data/mockdashboard";

export async function getAffectedLocations(filters = {}) {
  try {
    const res = await fetch("/api/zones", { cache: "no-store" });
    if (res.ok) {
      const zones = await res.json();
      if (Array.isArray(zones) && zones.length > 0) {
        let dynamicLocations = zones.map((z) => ({
          id: z.zoneId,
          name: z.name,
          state: z.state,
          district: z.district,
          hazardType: z.worstHazard
            ? z.worstHazard.charAt(0) + z.worstHazard.slice(1).toLowerCase()
            : "Multi-Hazard",
          riskLevel: z.zoneColor === "RED" ? "High" : z.zoneColor === "YELLOW" ? "Moderate" : "Low",
          peopleAffected: z.population || 0,
          latitude: z.lat,
          longitude: z.lng,
          status: z.isRedZone ? "active" : "monitoring",
          worstScore: z.worstScore,
          zoneColor: z.zoneColor,
        }));

        if (filters.hazardType && filters.hazardType !== "All") {
          dynamicLocations = dynamicLocations.filter((item) =>
            item.hazardType.toLowerCase().includes(filters.hazardType.toLowerCase())
          );
        }
        if (filters.riskLevel && filters.riskLevel !== "All") {
          dynamicLocations = dynamicLocations.filter(
            (item) => item.riskLevel.toLowerCase() === filters.riskLevel.toLowerCase()
          );
        }
        if (filters.state && filters.state !== "All") {
          dynamicLocations = dynamicLocations.filter((item) => item.state === filters.state);
        }
        if (filters.district && filters.district !== "All") {
          dynamicLocations = dynamicLocations.filter((item) => item.district === filters.district);
        }
        return dynamicLocations;
      }
    }
  } catch (err) {
    console.warn("Failed fetching dynamic affected locations, using mock data:", err);
  }

  let data = [...mocklocations];

  if (filters.hazardType && filters.hazardType !== "All") {
    data = data.filter((item) => item.hazardType === filters.hazardType);
  }
  if (filters.riskLevel && filters.riskLevel !== "All") {
    data = data.filter((item) => item.riskLevel === filters.riskLevel);
  }
  if (filters.state && filters.state !== "All") {
    data = data.filter((item) => item.state === filters.state);
  }
  if (filters.district && filters.district !== "All") {
    data = data.filter((item) => item.district === filters.district);
  }

  return data;
}

export async function getDashboardStats() {
  try {
    const res = await fetch("/api/zones", { cache: "no-store" });
    if (res.ok) {
      const zones = await res.json();
      if (Array.isArray(zones) && zones.length > 0) {
        const highRisk = zones.filter((z) => z.zoneColor === "RED").length;
        const moderateRisk = zones.filter((z) => z.zoneColor === "YELLOW").length;
        const lowRisk = zones.filter((z) => z.zoneColor === "GREEN").length;
        const affectedPeople = zones
          .filter((z) => z.zoneColor === "RED" || z.zoneColor === "YELLOW")
          .reduce((sum, z) => sum + (z.population || 0), 0);

        return {
          totalZones: zones.length,
          highRiskZones: highRisk,
          moderateRiskZones: moderateRisk,
          lowRiskZones: lowRisk,
          affectedPeople,
        };
      }
    }
  } catch (err) {
    console.warn("Failed fetching dynamic stats, using fallback:", err);
  }

  return mockdashboardstats;
}

export async function getAdminOverview() {
  const res = await fetch("/api/admin/overview", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch admin overview");
  return res.json();
}

export async function getSafeRoutes() {
  const res = await fetch("/api/admin/routes", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch safe routes");
  return res.json();
}

export async function updateZoneStatus(zoneId, updates) {
  const res = await fetch("/api/admin/zones", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zoneId, ...updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update zone in database");
  return data;
}

export async function updateRouteStatus(routeId, siteId, routeStatus) {
  const res = await fetch("/api/admin/routes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ routeId, siteId, routeStatus }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update route status in database");
  return data;
}

export async function updateSiteCapacity(siteId, updates) {
  const res = await fetch("/api/admin/relocation-sites", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, ...updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update site capacity in database");
  return data;
}