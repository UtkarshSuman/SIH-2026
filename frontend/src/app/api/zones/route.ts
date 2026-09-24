import { NextResponse } from "next/server";
import { getRecentZones } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get("id");
  const query = searchParams.get("query")?.toLowerCase();

  const zones = await getRecentZones();

  if (zoneId) {
    const found = zones.find((z) => z.zoneId.toLowerCase() === zoneId.toLowerCase());
    if (!found) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
    return NextResponse.json(found);
  }

  if (query) {
    const filtered = zones.filter(
      (z) =>
        z.name.toLowerCase().includes(query) ||
        z.district.toLowerCase().includes(query) ||
        z.state.toLowerCase().includes(query) ||
        z.zoneId.toLowerCase().includes(query)
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(zones);
}
