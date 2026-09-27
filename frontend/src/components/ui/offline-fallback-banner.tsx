"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Database } from "lucide-react";

interface OfflineFallbackBannerProps {
  isFallback: boolean;
  message?: string;
  source?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function OfflineFallbackBanner({
  isFallback,
  message = "Database or backend offline using internal latest data.",
  source,
  onRetry,
  isRetrying = false,
  className = "",
}: OfflineFallbackBannerProps) {
  if (!isFallback) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs ${className}`}
        title="Connected to live PostgreSQL database"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <Database className="h-3.5 w-3.5 text-emerald-600" />
        <span>Live Database Connected</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-4 shadow-md text-amber-950 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                Offline Cache Mode
              </span>
              <h4 className="text-sm font-black text-amber-950">
                {message}
              </h4>
            </div>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Live PostgreSQL database or backend is currently unreachable. Displaying internal latest synchronized telemetry cache. Live changes might not sync to remote cloud storage until connectivity is restored.
              {source && <span className="ml-1 text-[11px] font-medium text-amber-700">({source})</span>}
            </p>
          </div>
        </div>

        {onRetry && (
          <div className="shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-amber-800 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin text-amber-300" : ""}`} />
              <span>{isRetrying ? "Reconnecting..." : "Retry Database"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
