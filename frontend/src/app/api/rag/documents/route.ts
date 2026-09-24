/** FEATURE: Admin-only proxy to list ingested documents. INSTALLATION: none. */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { listRagDocuments } from "@/server/services/rag-client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const data = await listRagDocuments();
  return NextResponse.json(data);
}