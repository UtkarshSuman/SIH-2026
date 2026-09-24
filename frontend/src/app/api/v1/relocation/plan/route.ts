import { NextResponse } from "next/server";
import { getRecentRelocationPlan } from "@/lib/data-service";

export async function GET() {
  const zones = await getRecentRelocationPlan();
  return NextResponse.json({ zones });
}
