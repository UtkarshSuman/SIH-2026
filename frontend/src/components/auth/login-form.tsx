/**
 * FEATURE: Login form, rendered inside AuthCard's left panel. Uses
 * NextAuth's client-side signIn("credentials", ...). Reads two things
 * from the URL query string:
 *   - `callbackUrl`: where to redirect after login (set by middleware.ts
 *     when an unauthenticated user tries to reach a protected page, e.g.
 *     the future chatbot/ML pages)
 *   - `verified`: "1"/"0" set by the /api/auth/verify-email redirect, shown
 *     as a one-time success/error banner
 *
 * INSTALLATION: npm install next-auth zod
 *   (already in frontend/package.json)
 *
 * FUTURE RECOMMENDATION: add an OAuth button row here once Google/GitHub
 * providers are added to server/auth/config.ts.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "@/lib/validators";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const verified = searchParams.get("verified");

  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
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
        <p className="rounded-md bg-green-50 p-2 text-sm text-green-700">
          Email verified - you can now log in.
        </p>
      )}
      {verified === "0" && (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          That verification link is invalid or expired.
        </p>
      )}
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}