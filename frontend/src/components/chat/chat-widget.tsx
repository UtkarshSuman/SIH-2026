"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  Database,
  BookOpen,
  ArrowUpRight,
  Activity,
  User,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { chatSuggestionCategories } from "@/data/chat-suggestions";
import { ChatMarkdown } from "./chat-markdown";

export function ChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const { messages, sendMessage, isStreaming, clearMessages, stopStreaming } = useChatStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on streaming update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  }

  function handlePromptClick(promptQuery: string) {
    sendMessage(promptQuery);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. CHAT PANEL
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`mb-3 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ${
            isExpanded
              ? "h-[740px] w-[820px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)]"
              : "h-[580px] w-[420px] max-w-[calc(100vw-30px)] max-h-[calc(100vh-100px)]"
          }`}
          style={{
            boxShadow:
              "0 20px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Bot className="h-5 w-5 text-emerald-700" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-slate-900">Rescue Arc Copilot</h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Live GIS + RAG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Telemetry &amp; NDMA SOPs Active</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={clearMessages}
                title="Clear conversation"
                className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((e) => !e)}
                title={isExpanded ? "Collapse view" : "Expand view"}
                className="hidden sm:inline-flex rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 text-xs scroll-smooth">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="flex flex-col gap-3 py-2">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-xs">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">How can I help you today?</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    Ask about hazard zones, live flood telemetry, safe shelter capacities, or NDMA evacuation protocols.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800 font-semibold">
                      <Database className="h-3 w-3 text-emerald-700" /> Live GIS Tools
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-blue-800 font-semibold">
                      <BookOpen className="h-3 w-3 text-blue-700" /> RAG Standards
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-semibold">
                      <Activity className="h-3 w-3 text-amber-700" /> 24/7 Monitored
                    </span>
                  </div>
                </div>

                {/* Categories Tabs */}
                <div>
                  <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5 mb-2">
                    {chatSuggestionCategories.map((cat, idx) => (
                      <button
                        key={cat.category}
                        onClick={() => setActiveCategory(idx)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          activeCategory === idx
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                        }`}
                      >
                        {cat.category}
                      </button>
                    ))}
                  </div>

                  {/* Prompts for Active Category */}
                  <div className="flex flex-col gap-1.5">
                    {chatSuggestionCategories[activeCategory]?.prompts.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handlePromptClick(p.query)}
                        className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 text-left text-xs transition-all hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {p.label}
                            </span>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{p.query}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.badge && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                              {p.badge}
                            </span>
                          )}
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-700 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages Stream */}
            {messages.map((m) => {
              const isUser = m.role === "user";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-500">
                    {isUser ? (
                      <>
                        <span className="font-medium text-slate-700">{session?.user?.name || "You"}</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <Bot className="h-3 w-3 text-emerald-700" /> Rescue Arc Copilot
                        </span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative rounded-2xl px-4 py-3 text-xs transition-all ${
                      isUser
                        ? "max-w-[85%] bg-emerald-700 text-white shadow-xs font-medium"
                        : "max-w-[95%] border border-slate-200/90 bg-white text-slate-900 shadow-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="space-y-2">
                        {/* Tool Headers Pill if available */}
                        {m.toolsUsed && m.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            {m.toolsUsed.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800"
                              >
                                <Database className="h-2.5 w-2.5 text-emerald-700" />
                                {t}()
                              </span>
                            ))}
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                              <BookOpen className="h-2.5 w-2.5 text-blue-700" />
                              RAG Verified
                            </span>
                          </div>
                        )}

                        {/* Markdown Content */}
                        {m.content ? (
                          <ChatMarkdown content={m.content} />
                        ) : (
                          isStreaming && (
                            <div className="flex items-center gap-2 text-slate-500 py-1">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                              </span>
                              <span className="text-[11px] font-medium text-slate-600 animate-pulse">
                                Executing tools &amp; synthesizing GIS telemetry...
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Actions (Assistant Only) */}
                  {!isUser && m.content && (
                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Streaming Stop Indicator */}
          {isStreaming && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-emerald-50/50 px-3.5 py-1.5 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Streaming answer from RAG + Database Store...
              </span>
              <button
                type="button"
                onClick={stopStreaming}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                Stop Generating
              </button>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200/90 bg-white p-3"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about zones, live telemetry, shelters, Sphere standards..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-xs text-slate-900 shadow-inner transition-colors placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs transition-transform hover:scale-105 hover:bg-emerald-800 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-500">
              <span>Enter to send • Shift+Enter for new line</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                PostGIS &amp; RAG Connected
              </span>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING NATURAL CIRCULAR LAUNCHER BUTTON
      ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? "Close AI Disaster Assistant" : "Open AI Disaster Assistant"}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:scale-105 hover:bg-emerald-800 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6 transition-transform duration-200" />
            {/* Subtle active online indicator */}
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white"></span>
            </span>
          </>
        )}

        {/* Hover Tooltip (Desktop only) */}
        {!isOpen && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 pointer-events-none group-hover:opacity-100">
            Ask Rescue Arc Copilot
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
          </div>
        )}
      </button>
    </div>
  );
}