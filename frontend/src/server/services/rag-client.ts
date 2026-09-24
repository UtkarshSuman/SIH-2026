/**
 * FEATURE: Proxies RAG chat, document listing, and document ingestion
 * to the backend service.
 */
import { env } from "@/lib/env";

const BASE_URL = env.ML_SERVICE_URL ?? "http://localhost:8000";
const API_KEY = env.ML_SERVICE_API_KEY ?? "";

export async function streamRagChat(message: string): Promise<Response> {
  const res = await fetch(`${BASE_URL}/api/v1/rag/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ message }),
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`RAG service error: ${res.status}`);
  return res;
}

export async function listRagDocuments(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/rag/documents`, {
    headers: { "X-API-Key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    return { success: true, documents: [] };
  }
  return res.json();
}

export async function ingestDocument(body: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/rag/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`);
  return res.json();
}