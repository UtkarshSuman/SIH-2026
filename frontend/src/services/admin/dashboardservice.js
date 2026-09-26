import { mocklocations } from "@/data/mocklocations";
import { mockdashboardstats } from "@/data/mockdashboard";

export async function getAffectedLocations(filters = {}) {
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
  return mockdashboardstats;
}