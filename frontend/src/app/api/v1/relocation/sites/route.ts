import { NextResponse } from "next/server";
import { getRecentRelocationSites } from "@/lib/data-service";

export async function GET() {
  try {
    return NextResponse.json({ sites: await getRecentRelocationSites() });
  } catch (error) {
    console.error("Failed to load relocation sites", error);
    return NextResponse.json({ error: "Unable to load relocation sites from the database", sites: [] }, { status: 500 });
  }
}
