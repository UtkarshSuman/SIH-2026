/**
 * FEATURE: Admin form to ingest a .txt document (upload OR paste text
 * directly) plus a list of what's already been ingested.
 * INSTALLATION: none - uses the browser's built-in FileReader.
 */
"use client";

import { useEffect, useState } from "react";

interface RagDoc {
  id: string;
  title: string;
  sourceType: string;
  chunkCount: number;
  ingestedAt: string;
}

export function RagDocumentUploadForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RagDoc[]>([]);

  async function loadDocuments() {
    const res = await fetch("/api/rag/documents");
    if (res.ok) setDocuments((await res.json()).documents);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setMessage("Only .txt files are supported.");
      return;
    }
    if (!title) setTitle(file.name.replace(/\.txt$/, ""));
    const reader = new FileReader();
    reader.onload = () => setContent(reader.result as string);
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage("Title and content are both required.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceType: "text", content }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error?.message ?? data.error ?? "Ingestion failed.");
        return;
      }
      setMessage(`Ingested successfully — ${data.chunksCreated} chunks created.`);
      setTitle("");
      setContent("");
      loadDocuments();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Ingest a document</h2>
        {message && <p className="text-sm">{message}</p>}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Upload a .txt file (optional)</label>
          <input type="file" accept=".txt" onChange={handleFileChange} className="text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="Paste text here, or upload a .txt file above"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Ingesting..." : "Ingest document"}
        </button>
      </form>

      <div>
        <h2 className="font-semibold">Ingested documents</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">Title</th>
              <th className="py-2">Chunks</th>
              <th className="py-2">Ingested</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-border/50">
                <td className="py-2">{d.title}</td>
                <td className="py-2">{d.chunkCount}</td>
                <td className="py-2">{new Date(d.ingestedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}