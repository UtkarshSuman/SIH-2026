"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, Loader2, CheckCircle2, AlertTriangle, Clock, Zap } from "lucide-react";

export interface PipelineTriggerButtonProps {
  onSuccess?: (results?: any) => Promise<void> | void;
  className?: string;
  buttonText?: string;
  variant?: "emerald" | "slate" | "compact";
  showStatusBanner?: boolean;
  onStatusChange?: (status: { type: "loading" | "success" | "warning" | "error" | "info"; message: string } | null) => void;
}

export function PipelineTriggerButton({
  onSuccess,
  className = "",
  buttonText = "Trigger Live Assessment Pipeline",
  variant = "emerald",
  showStatusBanner = true,
  onStatusChange,
}: PipelineTriggerButtonProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState<{
    type: "loading" | "success" | "warning" | "error" | "info";
    message: string;
  } | null>(null);

  const cooldownIntervalRef = useRef<any>(null);

  const updateStatus = useCallback(
    (status: { type: "loading" | "success" | "warning" | "error" | "info"; message: string } | null) => {
      setPipelineStatus(status);
      onStatusChange?.(status);
    },
    [onStatusChange]
  );

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    setCooldownRemaining(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Check initial cooldown/status from backend on mount
  useEffect(() => {
    let isMounted = true;
    fetch("/api/pipeline/trigger")
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.is_running) {
          setIsTriggering(true);
          updateStatus({
            type: "loading",
            message: "Pipeline is currently executing live GIS fetching & ML assessments (~60-80s)...",
          });
        } else if (data?.cooldown_remaining > 0) {
          startCooldown(data.cooldown_remaining);
        }
      })
      .catch(() => {
        // quiet ignore
      });

    return () => {
      isMounted = false;
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [startCooldown, updateStatus]);

  const handleTrigger = async () => {
    if (isTriggering || cooldownRemaining > 0) return;

    setIsTriggering(true);
    updateStatus({
      type: "loading",
      message: "Running multi-hazard GIS data ingestion & ML inference across all 13 zones (~60-80s)...",
    });

    try {
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        const waitTime = data.cooldown_remaining || 30;
        startCooldown(waitTime);
        updateStatus({
          type: "warning",
          message: data.message || `Pipeline is currently running or on cooldown. Please wait ${waitTime}s.`,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.detail || data.message || "Pipeline execution failed.");
      }

      // Success
      const count = data.results?.length || 13;
      updateStatus({
        type: "success",
        message: `✓ Pipeline complete! Assessed and upgraded ${count} zones with live ML scores. Reloading fresh data...`,
      });

      startCooldown(data.cooldown_seconds || 30);

      // Trigger caller's data refresh callback to dynamically re-load the page
      if (onSuccess) {
        try {
          await onSuccess(data.results);
        } catch (callbackErr) {
          console.error("Error refreshing page data after pipeline trigger:", callbackErr);
        }
      }
    } catch (err: any) {
      updateStatus({
        type: "error",
        message: `Pipeline trigger failed: ${err.message}`,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const isBlocked = isTriggering || cooldownRemaining > 0;

  // Variant classes
  let btnClasses = "rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ";
  if (variant === "compact") {
    btnClasses += "px-3 py-1.5 text-xs ";
  } else {
    btnClasses += "px-4 py-2.5 text-xs sm:text-sm ";
  }

  if (isTriggering) {
    btnClasses += "bg-slate-800 text-white opacity-95 cursor-wait shadow-inner ring-2 ring-amber-400/50 ";
  } else if (cooldownRemaining > 0) {
    btnClasses += "bg-slate-200 text-slate-500 cursor-not-allowed opacity-80 shadow-none border border-slate-300 ";
  } else if (variant === "slate") {
    btnClasses += "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-slate-900/20 ";
  } else {
    btnClasses += "bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95 shadow-emerald-700/20 ";
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleTrigger}
        disabled={isBlocked}
        title={
          isTriggering
            ? "Pipeline is running..."
            : cooldownRemaining > 0
            ? `Cooldown active (${cooldownRemaining}s remaining)`
            : "Trigger live GIS ingestion, ML inference, and DB update across all 13 zones"
        }
        className={`${btnClasses} ${className}`}
      >
        {isTriggering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>Assessing All 13 Zones (~60s)...</span>
          </>
        ) : cooldownRemaining > 0 ? (
          <>
            <Clock className="h-4 w-4 text-slate-500 animate-pulse" />
            <span>Rate-Limited ({cooldownRemaining}s cooldown)</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Status banner below button if enabled */}
      {showStatusBanner && pipelineStatus && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all animate-in fade-in slide-in-from-top-1 ${
            pipelineStatus.type === "loading"
              ? "border-amber-200 bg-amber-50 text-amber-900 shadow-sm"
              : pipelineStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm"
              : pipelineStatus.type === "warning"
              ? "border-orange-200 bg-orange-50 text-orange-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className="flex items-start gap-2">
            {pipelineStatus.type === "loading" && (
              <Loader2 className="h-3.5 w-3.5 mt-0.5 animate-spin text-amber-600 shrink-0" />
            )}
            {pipelineStatus.type === "success" && (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
            )}
            {(pipelineStatus.type === "warning" || pipelineStatus.type === "error") && (
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-orange-600 shrink-0" />
            )}
            <span className="leading-snug">{pipelineStatus.message}</span>
          </div>

          <button
            type="button"
            onClick={() => updateStatus(null)}
            className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
            title="Dismiss status"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
