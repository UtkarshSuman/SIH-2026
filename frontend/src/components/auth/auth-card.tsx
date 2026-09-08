"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AuthVisualPanel } from "./auth-visual-panel";
import type { AuthMode } from "@sih/types";

export function AuthCard({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function switchMode(next: AuthMode) {
    setMode(next);
    const url = next === "register" ? "/login?mode=register" : "/login";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="relative flex w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-200/80 bg-white shadow-2xl shadow-emerald-950/10 min-h-[580px]">
      {/* Return to Home Close Button */}
      <Link
        href="/"
        aria-label="Close and return to home"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 backdrop-blur-md shadow-xs transition-all hover:bg-slate-100 hover:text-slate-900"
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      >
        <X size={18} />
      </Link>

      {/* Form Panel */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 lg:w-1/2">
        <div>
          {/* TAB MODE SWITCHER */}
          <div className="mb-6 flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Register Agency
            </button>
          </div>

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {mode === "login" ? "Official Command Login" : "Register Disaster Cell"}
            </h1>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {mode === "login"
                ? "Enter your verified credentials to access real-time early warning telemetry."
                : "Join the NDRF & state disaster response coordination network."}
            </p>
          </div>

          {/* FORM */}
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* BOTTOM SWITCHER LINK */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === "login" ? (
            <p>
              New responding agency or officer?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1"
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
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Visual Panel on Desktop */}
      <AuthVisualPanel />
    </div>
  );
}