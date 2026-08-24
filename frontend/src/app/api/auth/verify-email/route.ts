/**
 * FEATURE: Email verification link handler. The link emailed to the user
 * (see server/services/email.ts) points here as
 * /api/auth/verify-email?token=xxx. On a valid, unexpired token: marks
 * User.emailVerified, deletes the token (one-time use), and redirects to
 * /login with a status flag the LoginForm reads to show a success/error
 * message.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@sih/database";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    loginUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(loginUrl);
  }

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    loginUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(loginUrl);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ]);

  loginUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(loginUrl);
}