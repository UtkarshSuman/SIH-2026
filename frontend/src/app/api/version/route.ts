import { NextResponse } from "next/server";
import { getDatabaseVersion } from "@/lib/data-service";

export async function GET() {
  try {
    return NextResponse.json(await getDatabaseVersion());
  } catch (error) {
    console.error("Failed to load database version", error);
    return NextResponse.json({ error: "Unable to load database version", version: 0, lastUpdated: null }, { status: 500 });
  }
}
