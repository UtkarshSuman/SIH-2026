"use client";

import { useState } from "react";
import { forgotPasswordSchema } from "@/lib/validators";

function MailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-xs text-emerald-950 space-y-2">
        <div className="font-bold text-emerald-900 text-sm">✓ Reset Link Dispatched</div>
        <p className="leading-relaxed text-slate-700">
          If an official account exists for <strong>{email}</strong>, we have dispatched a secure password reset link. Please check your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-bold text-slate-700">
          Official Registered Email
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <MailIcon />
          </span>
          <input
            id="email"
            type="email"
            placeholder="officer@disaster.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Sending Reset Link..." : "Send Password Reset Link"}
      </button>
    </form>
  );
}