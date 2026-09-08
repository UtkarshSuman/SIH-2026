"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "@/lib/validators";

function MailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified");

  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "EMAIL_NOT_VERIFIED"
            ? "Please verify your email before logging in - check your inbox."
            : "Invalid email or password"
        );
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {verified === "1" && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <span>✓</span> Email verified successfully - you can now log in.
        </div>
      )}
      {verified === "0" && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
          That verification link is invalid or expired.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* EMAIL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-bold text-slate-700">
          Official Email
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <MailIcon />
          </span>
          <input
            id="email"
            type="email"
            placeholder="officer@disaster.gov.in"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-bold text-slate-700">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <LockIcon />
          </span>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Verifying Credentials..." : "Sign in to Command"}
        {!loading && <ArrowRightIcon />}
      </button>
    </form>
  );
}