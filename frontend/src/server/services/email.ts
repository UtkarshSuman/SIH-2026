/**
 * FEATURE: Transactional email sending via Resend - used for the "verify
 * your email" link (sent right after signup) and the "reset your password"
 * link (sent from the forgot-password form). This is the ONLY file that
 * talks to Resend directly - routes call these two functions instead of
 * building emails inline, so the templates only live in one place.
 *
 * INSTALLATION:
 *   1. npm install resend   (already in frontend/package.json)
 *   2. Sign up free at https://resend.com
 *   3. Dashboard -> API Keys -> Create API Key -> copy it
 *   4. Paste into .env as RESEND_API_KEY=re_xxxxxxxx
 *   5. Free/unverified accounts can ONLY send email FROM
 *      "onboarding@resend.dev" TO the email address you signed up to
 *      Resend with. To send to real users, add + verify your own domain
 *      under Domains in the Resend dashboard, then set EMAIL_FROM to
 *      something like "SIH Project <no-reply@yourdomain.com>".
 *
 * FUTURE RECOMMENDATION: swap the inline HTML strings below for React
 * Email (`npm install react-email @react-email/components`) once the
 * email design needs to match the app's branding more closely.
 */
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `Verify your email - ${env.NEXT_PUBLIC_APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          Verify email
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `Reset your password - ${env.NEXT_PUBLIC_APP_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          Reset password
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">
          If you didn't request this, you can safely ignore this email - your password won't change.
        </p>
      </div>
    `,
  });
}