/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Email verification handler — validates token, marks user verified,
 * then redirects to /login with ?verified=1 or ?verified=0.
 * Uses Supabase REST API (no direct PostgreSQL needed).
 */
import { NextRequest, NextResponse } from "next/server";
import {
  findEmailVerificationToken,
  markEmailVerified,
  deleteEmailVerificationToken,
} from "@/lib/auth-rest-client";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    loginUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const record = await findEmailVerificationToken(token);

    if (!record || new Date(record.expires_at) < new Date()) {
      loginUrl.searchParams.set("verified", "0");
      return NextResponse.redirect(loginUrl);
    }

    await markEmailVerified(record.user_id);
    await deleteEmailVerificationToken(token);
  } catch (err) {
    console.error("[VerifyEmail] Error:", err);
    loginUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(loginUrl);
  }

  loginUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(loginUrl);
}