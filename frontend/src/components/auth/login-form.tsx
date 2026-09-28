"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validators";

interface LoginFormProps {
  prefillEmail?: string;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ prefillEmail, onSwitchToRegister }: LoginFormProps) {
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified");

  const [values, setValues] = useState<LoginFormValues>({
    email: prefillEmail || "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fillAdminDemo() {
    setValues({
      email: "teamsih12@gmail.com",
      password: "12345678",
    });
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const emailClean = values.email.trim().toLowerCase();
    const parsed = loginSchema.safeParse({
      email: emailClean,
      password: values.password,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: emailClean,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "EMAIL_NOT_VERIFIED"
            ? "Please verify your email before logging in - check your inbox."
            : "Invalid official email or password. Please verify your credentials."
        );
        return;
      }

      // Check user role from fresh session endpoint or NextAuth session to redirect admin
      let isAdmin = false;
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const role = (sessionData?.user?.role || "").toUpperCase();
          if (role === "ADMIN" || role === "SUPER_ADMIN" || role.includes("ADMIN")) {
            isAdmin = true;
          }
        }
      } catch (_) {}

      if (!isAdmin) {
        const session = await getSession();
        const userRole = (session?.user as any)?.role?.toUpperCase?.() || "";
        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole.includes("ADMIN")) {
          isAdmin = true;
        }
      }

      // Fallback for primary administrative account
      if (
        !isAdmin &&
        (emailClean === "teamsih12@gmail.com" || emailClean.includes("admin"))
      ) {
        isAdmin = true;
      }

      // Perform direct page navigation so session cookies are fresh across all components
      if (isAdmin) {
        window.location.href = "/admin";
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {/* VERIFICATION NOTICES */}
      {verified === "1" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-medium text-emerald-900 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Email verified successfully. You can now log in.</span>
        </div>
      )}

      {verified === "0" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-900 shadow-xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>The verification link is invalid or has expired.</span>
        </div>
      )}

      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 shadow-xs animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* EMAIL FIELD */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-slate-700">
          Official Email Address
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <Mail size={16} />
          </span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="officer@disaster.gov.in"
            value={values.email}
            onChange={(e) =>
              setValues((v) => ({ ...v, email: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
            required
          />
        </div>
      </div>

      {/* PASSWORD FIELD */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <Lock size={16} />
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* QUICK ADMIN HELPER BADGE */}
      <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-800">
        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <Sparkles size={13} className="text-emerald-600" />
          Default Admin: teamsih12@gmail.com
        </span>
        <button
          type="button"
          onClick={fillAdminDemo}
          className="font-bold text-emerald-800 hover:text-emerald-950 underline hover:no-underline ml-2 text-[11px]"
        >
          Quick Fill
        </button>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-emerald-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <span>Sign In to Command</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}