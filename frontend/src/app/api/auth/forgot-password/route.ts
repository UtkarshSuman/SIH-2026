/**
 * FEATURE: "Forgot password" request handler. Generates a short-lived
 * (1 hour) reset token and emails a reset link via Resend.
 *
 * SECURITY NOTE: this always returns the same success response whether or
 * not the email exists in the database - returning a different response
 * for "email not found" lets attackers enumerate which emails have
 * accounts, so we deliberately hide that distinction.
 *
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@sih/database";
import { forgotPasswordSchema } from "@/lib/validators";
import { generateSecureToken, hoursFromNow } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/server/services/email";

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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: hoursFromNow(1) },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  // Same response regardless of whether `user` was found - see SECURITY NOTE above.
  return NextResponse.json(GENERIC_SUCCESS);
}