import { NextResponse } from "next/server";

const BACKEND_ENDPOINTS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  process.env.BACKEND_API_BASE,
  process.env.BACKEND2_URL,
].filter(Boolean) as string[];

// Concurrency lock and cooldown in server memory
let isPipelineExecuting = false;
let lastTriggerTime = 0;
const RATE_LIMIT_SECONDS = 30;

export async function GET() {
  for (const base of BACKEND_ENDPOINTS) {
    try {
      const res = await fetch(`${base}/api/pipeline/status`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }

  const now = Date.now();
  const elapsed = (now - lastTriggerTime) / 1000;
  const rem = Math.max(0, Math.ceil(RATE_LIMIT_SECONDS - elapsed));
  return NextResponse.json({
    is_running: isPipelineExecuting,
    is_on_cooldown: rem > 0,
    cooldown_remaining: isPipelineExecuting ? 30 : rem,
  });
}

export async function POST() {
  // 1. Concurrency lock check
  if (isPipelineExecuting) {
    return NextResponse.json(
      {
        status: "rate_limited",
        message: "Pipeline is currently executing an assessment batch. Please wait for completion.",
        cooldown_remaining: 30,
      },
      { status: 429 }
    );
  }

  // 2. Cooldown check
  const now = Date.now();
  const elapsed = (now - lastTriggerTime) / 1000;
  if (elapsed < RATE_LIMIT_SECONDS) {
    const remaining = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
    return NextResponse.json(
      {
        status: "rate_limited",
        message: `Pipeline trigger is on cooldown. Please wait ${remaining}s before triggering again.`,
        cooldown_remaining: remaining,
      },
      { status: 429 }
    );
  }

  isPipelineExecuting = true;
  let lastError: any = null;

  try {
    for (const base of BACKEND_ENDPOINTS) {
      try {
        const url = `${base}/api/pipeline/trigger-all`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s for full 13-zone batch

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
  } finally {
    isPipelineExecuting = false;
    lastTriggerTime = Date.now();
  }
}
