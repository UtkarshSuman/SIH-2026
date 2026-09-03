/**
 * FEATURE: Transactional + alert email via Brevo (free tier: 300
 * emails/day). Same three functions callers already use, plus a new
 * generic sendAlertEmail() for any future "notify user" feature - not
 * wired to a trigger yet, call it from wherever a feature needs it.
 * INSTALLATION: sign up at brevo.com, verify a sender, get an API key -
 * see the setup steps in chat. No SDK needed - calls Brevo's REST API
 * directly.
 */
import { env } from "@/lib/env";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

async function sendBrevoEmail(to: string, subject: string, html: string) {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  await sendBrevoEmail(
    to,
    `Verify your email - ${env.NEXT_PUBLIC_APP_NAME}`,
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your email</h2>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Verify email</a>
      <p style="color:#666;font-size:12px;margin-top:24px;">If you didn't create an account, you can ignore this email.</p>
    </div>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendBrevoEmail(
    to,
    `Reset your password - ${env.NEXT_PUBLIC_APP_NAME}`,
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a>
      <p style="color:#666;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`
  );
}

/** FEATURE: Generic alert email - not wired to any trigger yet. */
export async function sendAlertEmail(to: string, subject: string, message: string) {
  await sendBrevoEmail(
    to,
    subject,
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;"><p>${message}</p></div>`
  );
}