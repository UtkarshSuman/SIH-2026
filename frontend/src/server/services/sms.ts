/**
 * FEATURE: SMS alerts via Fast2SMS's free "Quick SMS" route. INDIA-ONLY -
 * 10-digit Indian numbers, daily quota on free tier, meant for
 * testing/OTP-style messages, not production bulk SMS. Not wired to any
 * trigger yet - call sendAlertSms() from wherever a future feature needs
 * to notify a user by SMS.
 * INSTALLATION: sign up at fast2sms.com (needs an Indian mobile number),
 * Dev API -> copy API key -> paste into .env as FAST2SMS_API_KEY. No SDK
 * needed - calls their REST API directly.
 */
import { env } from "@/lib/env";

const FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2";

export async function sendAlertSms(phoneNumber: string, message: string) {
  const res = await fetch(FAST2SMS_ENDPOINT, {
    method: "POST",
    headers: { authorization: env.FAST2SMS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "q",
      message,
      language: "english",
      flash: 0,
      numbers: phoneNumber, // 10-digit Indian number, no country code prefix
    }),
  });

  if (!res.ok) {
    throw new Error(`Fast2SMS send failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}