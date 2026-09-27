/**
 * POST /api/auth/forgot-password
 *
 * Generates a short-lived (1 hour) reset token and emails a reset link.
 * Always returns the same success response to prevent email enumeration.
 * Uses Supabase REST API (no direct PostgreSQL needed).
 */
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators";
import { generateSecureToken, hoursFromNow } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/server/services/email";
import { findUserByEmail, createPasswordResetToken } from "@/lib/auth-rest-client";

const GENERIC_SUCCESS = {
  success: true,
  data: { message: "If an account exists for that email, a reset link has been sent." },
};

export async function POST(req: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    if (user) {
      const token = generateSecureToken();
      await createPasswordResetToken(user.id, token, hoursFromNow(1));
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (err) {
        console.error("[ForgotPassword] Email send failed:", err);
      }
    }
  } catch (err) {
    console.error("[ForgotPassword] DB error:", err);
  }

  // Same response regardless of whether user exists (prevents enumeration)
  return NextResponse.json(GENERIC_SUCCESS);
}