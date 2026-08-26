/**
 * FEATURE: Floating chat widget - now mounted globally (see providers.tsx)
 * so it appears on every page, not just /dashboard. Clicking the button:
 *   - if logged in: toggles the chat panel open/closed, as before
 *   - if logged out: redirects to /login?callbackUrl=<current page>
 *     instead of opening anything, so they return to where they were
 *     after logging in
 * Hidden entirely on the auth pages themselves (login/register/forgot/
 * reset) - showing "log in to chat" ON the login page would be a
 * confusing loop.
 * INSTALLATION: none beyond use-chat-stream.ts.
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useChatStream } from "@/hooks/use-chat-stream";

const HIDDEN_ON_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function ChatWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isStreaming } = useChatStream();

  if (HIDDEN_ON_PREFIXES.some((p) => pathname?.startsWith(p))) {
    return null;
  }

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
        <div className="mb-3 flex h-[420px] w-[340px] flex-col rounded-lg border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-medium">Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
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
      <button
        onClick={handleToggle}
        className="rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg"
      >
        {isPanelOpen ? "Close" : "Chat"}
      </button>
    </div>
  );
}