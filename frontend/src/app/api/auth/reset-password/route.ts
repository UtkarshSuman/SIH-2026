/**
 * POST /api/auth/reset-password
 *
 * Completes the password reset — validates token (exists, unexpired, unused),
 * hashes new password, updates user, marks token used.
 * Uses Supabase REST API (no direct PostgreSQL needed).
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validators";
import {
  findPasswordResetToken,
  updateUserPassword,
  markPasswordResetTokenUsed,
} from "@/lib/auth-rest-client";

export async function POST(req: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  let record;
  try {
    record = await findPasswordResetToken(token);
  } catch (err) {
    console.error("[ResetPassword] DB lookup error:", err);
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: "Database unavailable. Try again." } },
      { status: 503 }
    );
  }

  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await updateUserPassword(record.user_id, passwordHash);
  await markPasswordResetTokenUsed(token);

  return NextResponse.json({ success: true, data: { message: "Password updated successfully." } });
}