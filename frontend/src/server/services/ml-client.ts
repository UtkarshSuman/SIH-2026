/**
 * FEATURE: Thin typed client to the Python ML service - the ONLY file in
 * Next.js that knows the FastAPI service's HTTP contract. Swapping or
 * adding models never requires touching callers of `predict()`.
 */
import { env } from "@/lib/env";

export async function predict(modelName: string, input: Record<string, unknown>) {
  const res = await fetch(`${env.ML_SERVICE_URL}/api/v1/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": env.ML_SERVICE_API_KEY },
    body: JSON.stringify({ modelName, input }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ML service error (${res.status}): ${await res.text()}`);
  return res.json();
}