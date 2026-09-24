import { NextResponse } from "next/server";
import { getRecentRelocationSites } from "@/lib/data-service";

export async function GET() {
  const sites = await getRecentRelocationSites();
  return NextResponse.json({ sites });
}
