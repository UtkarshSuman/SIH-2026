/**
 * FEATURE: Admin-only proxy to the backend's /rag/ingest - adds the
 * shared API key server-side (never exposed to the browser) and checks
 * the caller is ADMIN/SUPER_ADMIN before forwarding.
 * INSTALLATION: none.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { ingestDocument } from "@/server/services/rag-client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const result = await ingestDocument(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 502 });
  }
}