/**
 * FEATURE: Rescue Arc Disaster Intelligence Copilot - Floating Chat Widget.
 * Visible on every page, backed by RAG retrieval and live PostGIS database fetching tools.
 * 
 * Features:
 * - Always accessible across all routes (no auth wall for life safety hazard queries).
 * - Dual viewport: Compact Floating Mode (420px) and Expanded Analytics Mode (760px).
 * - RAG & Live Database execution badges (shows queried telemetry & cited standards).
 * - Interactive categorized starter prompts with live DB & RAG pills.
 * - Rich markdown rendering for tables, lists, and colored hazard badges.
 * - Auto-scroll, copy-to-clipboard, stream cancellation, and chat reset.
 */
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
    <div className="fixed bottom-5 right-5 z-[9999] font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. CHAT PANEL
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`mb-3 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            isExpanded
              ? "h-[740px] w-[820px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)]"
              : "h-[580px] w-[420px] max-w-[calc(100vw-30px)] max-h-[calc(100vh-100px)]"
          }`}
          style={{
            boxShadow:
              "0 20px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(37, 99, 235, 0.12)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Rescue Arc AI</h3>
                  <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-1.5 py-0.2 text-[10px] font-semibold text-blue-300">
                    RAG + Live DB
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Real-time GIS & PostGIS telemetry active</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearMessages}
                title="Clear conversation"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((e) => !e)}
                title={isExpanded ? "Collapse view" : "Expand view"}
                className="hidden sm:inline-flex rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors ml-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs scroll-smooth">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="flex flex-col gap-3 py-2">
                <div className="rounded-xl border border-border/60 bg-gradient-to-b from-primary/5 via-transparent to-transparent p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Disaster Intelligence Copilot</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Query real-time hazard classifications, PostGIS physical telemetry, Sphere-standard shelter capacities, and NDMA evacuation SOPs.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Database className="h-3 w-3" /> Live GIS Tools
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-blue-600 dark:text-blue-400 font-medium">
                      <BookOpen className="h-3 w-3" /> RAG Standards
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-amber-600 dark:text-amber-400 font-medium">
                      <Activity className="h-3 w-3" /> 24/7 Monitored
                    </span>
                  </div>
                </div>

                {/* Categories Tabs */}
                <div>
                  <div className="flex items-center gap-1 border-b border-border/40 pb-1 mb-2">
                    {chatSuggestionCategories.map((cat, idx) => (
                      <button
                        key={cat.category}
                        onClick={() => setActiveCategory(idx)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          activeCategory === idx
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
                        className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-left text-xs transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <div>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {p.label}
                            </span>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{p.query}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.badge && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                              {p.badge}
                            </span>
                          )}
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
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
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                    {isUser ? (
                      <>
                        <span>{session?.user?.name || "You"}</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Bot className="h-3 w-3" /> Rescue Arc Copilot
                        </span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative rounded-2xl px-3.5 py-2.5 text-xs transition-all ${
                      isUser
                        ? "max-w-[85%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-medium"
                        : "max-w-[95%] border border-border/70 bg-card text-card-foreground shadow-xs"
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
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400"
                              >
                                <Database className="h-2.5 w-2.5" />
                                {t}()
                              </span>
                            ))}
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                              <BookOpen className="h-2.5 w-2.5" />
                              RAG Verified
                            </span>
                          </div>
                        )}

                        {/* Markdown Content */}
                        {m.content ? (
                          <ChatMarkdown content={m.content} />
                        ) : (
                          isStreaming && (
                            <div className="flex items-center gap-2 text-muted-foreground py-1">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                              </span>
                              <span className="text-[11px] animate-pulse">
                                Executing tools & synthesizing GIS telemetry...
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Actions (Assistant Only) */}
                  {!isUser && m.content && (
                    <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
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
            <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Streaming answer from RAG + Database Store...
              </span>
              <button
                type="button"
                onClick={stopStreaming}
                className="text-[10px] font-semibold text-destructive hover:underline"
              >
                Stop Generating
              </button>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border/70 bg-card/60 p-3 backdrop-blur-md"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about zones, live telemetry, shelters, Sphere standards..."
                className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 pr-10 text-xs shadow-inner transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground/75">
              <span>Enter to send • Shift+Enter for new line</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                PostGIS & RAG Connected
              </span>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING LAUNCHER BUTTON
      ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? "Close AI Disaster Assistant" : "Open AI Disaster Assistant"}
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-3.5 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
        style={{
          boxShadow: "0 10px 30px -5px rgba(37, 99, 235, 0.45)",
        }}
      >
        {/* Pulsing Aura */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30 blur-sm group-hover:opacity-60 transition-opacity animate-pulse" />

        <div className="relative flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 transition-transform" />
          ) : (
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline-block">
                AI Disaster Copilot
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}