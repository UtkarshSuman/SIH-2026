/**
 * POST /api/register
 *
 * Signup endpoint — validates input, rejects duplicate emails,
 * hashes the password with bcrypt, then creates a User row via
 * Supabase REST API (HTTPS/443 — no direct PostgreSQL port needed).
 *
 * All new registrations get role: CITIZEN.
 * Admin account is seeded directly in the database migration.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validators";
import { generateSecureToken, hoursFromNow } from "@/lib/tokens";
import { sendVerificationEmail } from "@/server/services/email";
import {
  findUserByEmail,
  createUser,
  createEmailVerificationToken,
} from "@/lib/auth-rest-client";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const { name, email, password, mobileNumber, location } = parsed.data;

  // Check duplicate email
  let existing;
  try {
    existing = await findUserByEmail(email);
  } catch (err) {
    console.error("[Register] Database lookup error:", err);
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: "Unable to reach database. Try again." } },
      { status: 503 }
    );
  }

  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  // Hash password (cost 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user (role = CITIZEN by default)
  let user;
  try {
    user = await createUser({
      name,
      email,
      passwordHash,
      role: "CITIZEN",
      mobileNumber: mobileNumber || null,
      location: location || null,
    });
  } catch (err) {
    console.error("[Register] User creation error:", err);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_FAILED", message: "Account creation failed. Try again." } },
      { status: 500 }
    );
  }

  // Generate email verification token and send email
  // Failure here doesn't block account creation
  try {
    const token = generateSecureToken();
    await createEmailVerificationToken(user.id, token, hoursFromNow(24));
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error("[Register] Email verification send failed:", err);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 }
  );
}