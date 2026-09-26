/**
 * FEATURE: Handles streaming exchange with /api/chat.
 * Supports token streaming, tool execution headers, cancellation,
 * timestamps, and reset functionality.
 */
import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  ragSources?: string[];
  error?: boolean;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setIsStreaming(false);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessageId = crypto.randomUUID();
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: trimmed, timestamp: nowTime },
    ]);
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: nowTime },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Failed to get response");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `⚠️ **Error [${res.status}]**: ${errorText || "Could not connect to disaster intelligence service."}`,
                  error: true,
                }
              : m
          )
        );
        return;
      }

      // Read tools & RAG sources from headers
      const toolsHeader = res.headers.get("X-Tools-Executed");
      const ragHeader = res.headers.get("X-Rag-Sources");
      const toolsUsed = toolsHeader ? toolsHeader.split(",").filter(Boolean) : undefined;
      const ragSources = ragHeader ? ragHeader.split(",").filter(Boolean) : undefined;

      if (toolsUsed || ragSources) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, toolsUsed, ragSources } : m
          )
        );
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User deliberately aborted stream
        return;
      }
      console.error("[useChatStream] Streaming failed:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ **Connection Error**: ${err.message || "Failed to reach the Rescue Arc chatbot service. Please ensure the backend is available."}`,
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  return { messages, sendMessage, isStreaming, clearMessages, stopStreaming };
}