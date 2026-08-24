/**
 * FEATURE: Completes the password reset - validates the token (exists,
 * unexpired, unused), hashes the new password, updates the User row, and
 * marks the token used so the same link can't be replayed.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@sih/database";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message } },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
  ]);

  return NextResponse.json({ success: true, data: { message: "Password updated successfully." } });
}