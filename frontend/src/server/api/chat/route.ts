/**
 * FEATURE: Streaming chat endpoint - requires login (per your Phase 1
 * requirement: chatbot access needs auth), then pipes the FastAPI
 * service's streamed response straight through to the browser.
 */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { streamRagChat } from "@/server/services/rag-client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { message } = await req.json();
  const upstream = await streamRagChat(message);

  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}