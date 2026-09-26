import { NextResponse } from "next/server";
import { getRecentRelocationPlan } from "@/lib/data-service";

export async function GET() {
  try {
    return NextResponse.json({ zones: await getRecentRelocationPlan() });
  } catch (error) {
    console.error("Failed to load relocation plans", error);
    return NextResponse.json({ error: "Unable to load relocation plans from the database", zones: [] }, { status: 500 });
  }
}
