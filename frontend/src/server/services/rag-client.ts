/**
 * FEATURE: Proxies the streaming chat request to the Python service and
 * returns the raw stream for Next.js to pipe straight to the browser.
 */
import { env } from "@/lib/env";

export async function streamRagChat(message: string): Promise<Response> {
  const res = await fetch(`${env.ML_SERVICE_URL}/api/v1/rag/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": env.ML_SERVICE_API_KEY },
    body: JSON.stringify({ message }),
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`RAG service error: ${res.status}`);
  return res;
}