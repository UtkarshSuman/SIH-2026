import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminPagePath = path.join(process.cwd(), "..", "backend2", "Alert-system", "admin.html");
  const html = await readFile(adminPagePath, "utf8");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}