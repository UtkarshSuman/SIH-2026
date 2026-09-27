import { NextResponse } from "next/server";

const BACKEND_ENDPOINTS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  process.env.BACKEND_API_BASE,
  process.env.BACKEND2_URL,
].filter(Boolean) as string[];


// Client-side IP or session rate limiting fallback in memory
let lastTriggerTime = 0;
const RATE_LIMIT_SECONDS = 30;

export async function POST() {
  const now = Date.now();
  const elapsed = (now - lastTriggerTime) / 1000;
  if (elapsed < RATE_LIMIT_SECONDS) {
    const remaining = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
    return NextResponse.json(
      {
        status: "rate_limited",
        message: `Pipeline trigger is rate-limited. Please wait ${remaining}s before triggering again.`,
        cooldown_remaining: remaining,
      },
      { status: 429 }
    );
  }

  let lastError: any = null;
  for (const base of BACKEND_ENDPOINTS) {
    try {
      const url = `${base}/api/pipeline/trigger-all`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s for full 13-zone batch run

      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        return NextResponse.json(data, { status: 429 });
      }

      if (res.ok) {
        lastTriggerTime = Date.now();
        return NextResponse.json(data);
      }
      lastError = new Error(`Backend error ${res.status}: ${JSON.stringify(data)}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error("[/api/pipeline/trigger] All backends failed:", lastError);
  return NextResponse.json(
    {
      error: "Unable to trigger batch assessment pipeline.",
      detail: lastError?.message,
    },
    { status: 502 }
  );
}
