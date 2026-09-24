/**
 * FEATURE: Floating chat widget - shows 3 clickable starter questions
 * when no messages exist yet; clicking one sends it exactly like typing
 * would. Global (all pages), auth-gated on click, hidden on auth pages -
 * same behavior as before, with suggestions added.
 * INSTALLATION: none beyond use-chat-stream.ts.
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useChatStream } from "@/hooks/use-chat-stream";
import { chatSuggestions } from "@/data/chat-suggestions";

const HIDDEN_ON_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function ChatWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isStreaming } = useChatStream();

  if (HIDDEN_ON_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  function handleToggle() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    setOpen((o) => !o);
  }

  const isPanelOpen = open && !!session?.user;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isPanelOpen && (
        <div className="mb-3 flex h-[440px] w-[340px] flex-col rounded-lg border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-medium">Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-foreground/50">Try asking:</p>
                {chatSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-md border border-border px-3 py-2 text-left text-xs hover:bg-black/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    : "max-w-[85%] rounded-lg bg-black/5 px-3 py-2"
                }
              >
                {m.content || (isStreaming && m.role === "assistant" ? "…" : "")}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage(input.trim());
                setInput("");
              }
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-md border border-border px-2 py-1 text-sm"
              placeholder="Ask something..."
            />
            <button
              type="submit"
              disabled={isStreaming}
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
            >
              Send
            </button>
          </form>
        </div>
      )}
      <button onClick={handleToggle} className="rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg">
        {isPanelOpen ? "Close" : "Chat"}
      </button>
    </div>
  );
}