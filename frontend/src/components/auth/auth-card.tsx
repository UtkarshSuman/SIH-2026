"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import type { AuthMode } from "@sih/types";

export function AuthCard({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [prefillEmail, setPrefillEmail] = useState<string>("");

  function switchMode(next: AuthMode) {
    setMode(next);
    const url = next === "register" ? "/login?mode=register" : "/login";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl shadow-emerald-950/5">
      {/* Return to Home Close Button */}
      <Link
        href="/"
        aria-label="Close and return to home"
        className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800"
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      >
        <X size={16} />
      </Link>

      {/* TOP BADGE */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>NDRF & Forest Response Network</span>
        </div>
      </div>

      {/* TAB MODE SWITCHER */}
      <div className="mb-6 flex rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            mode === "login"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            mode === "register"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Register Agency
        </button>
      </div>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          {mode === "login" ? "Official Command Login" : "Register Disaster Cell"}
        </h1>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          {mode === "login"
            ? "Enter your verified credentials to access real-time early warning telemetry."
            : "Join the NDRF & state disaster response coordination network."}
        </p>
      </div>

      {/* FORM */}
      <div>
        {mode === "login" ? (
          <LoginForm
            prefillEmail={prefillEmail}
            onSwitchToRegister={() => switchMode("register")}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={(email) => {
              if (email) setPrefillEmail(email);
              switchMode("login");
            }}
          />
        )}
      </div>

      {/* BOTTOM SWITCHER LINK */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
        {mode === "login" ? (
          <p>
            New responding agency or officer?{" "}
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1 cursor-pointer"
            >
              Register organization
            </button>
          </p>
        ) : (
          <p>
            Already registered your authority cell?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}