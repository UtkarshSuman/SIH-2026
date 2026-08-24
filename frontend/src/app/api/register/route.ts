/**
 * FEATURE: Signup endpoint. Validates input, rejects duplicate emails,
 * hashes the password, creates the User row, then generates an email
 * verification token and sends the verification email via Resend.
 *
 * INSTALLATION: npm install bcryptjs resend
 *   (already in frontend/package.json - see server/services/email.ts for
 *   the Resend account setup steps)
 *
 * FUTURE RECOMMENDATION: add basic rate limiting per IP (Phase 3+, once
 * Redis is back in the stack) to prevent signup-spam / account-enumeration
 * abuse, and a CAPTCHA if this becomes a public-facing form.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@sih/database";
import { registerSchema } from "@/lib/validators";
import { generateSecureToken, hoursFromNow } from "@/lib/tokens";
import { sendVerificationEmail } from "@/server/services/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message } },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "CITIZEN" },
    select: { id: true, name: true, email: true, role: true },
  });

  // Generate + store a verification token, then email it.
  // Email sending failure shouldn't block account creation, so this is
  // wrapped separately - the user can still request a fresh link later
  // if you add a "resend verification email" button (Phase 2+).
  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, token, expiresAt: hoursFromNow(24) },
  });

  try {
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}