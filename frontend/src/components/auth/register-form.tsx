"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { registerSchema, type RegisterFormValues } from "@/lib/validators";
import { locations } from "@/data/location";

interface RegisterFormProps {
  onSwitchToLogin?: (email?: string) => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    location: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailClean = values.email.trim().toLowerCase();
    const nameClean = values.name.trim();

    const parsed = registerSchema.safeParse({
      ...values,
      name: nameClean,
      email: emailClean,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form inputs");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "Failed to create account. Please try again.");
        return;
      }

      setSubmittedEmail(emailClean);
    } catch {
      setError("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center text-xs text-emerald-950 space-y-4 animate-in fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Account Created Successfully!
          </h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your official responder profile for <strong className="text-slate-900">{submittedEmail}</strong> is ready. You can now sign in to access the command telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSwitchToLogin?.(submittedEmail)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-emerald-800 active:scale-[0.99] cursor-pointer"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 shadow-xs animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* FULL NAME */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-name" className="text-xs font-semibold text-slate-700">
          Full Name / Officer Designation
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <User size={16} />
          </span>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Officer Rajesh Kumar"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
            required
          />
        </div>
      </div>

      {/* EMAIL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-email" className="text-xs font-semibold text-slate-700">
          Official Email
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <Mail size={16} />
          </span>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="officer@disaster.gov.in"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
            required
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-password" className="text-xs font-semibold text-slate-700">
          Password <span className="font-normal text-slate-400">(min. 8 characters)</span>
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <Lock size={16} />
          </span>
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
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

      {/* MOBILE NUMBER & ASSESSMENT ZONE (2 COLUMNS ON SM) */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-mobile" className="text-xs font-semibold text-slate-700">
            Mobile <span className="font-normal text-slate-400">(SMS Alerts)</span>
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-slate-400">
              <Phone size={15} />
            </span>
            <input
              id="reg-mobile"
              type="tel"
              value={values.mobileNumber}
              onChange={(e) => setValues((v) => ({ ...v, mobileNumber: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
              placeholder="9876543210"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-location" className="text-xs font-semibold text-slate-700">
            Assigned Zone
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-slate-400">
              <MapPin size={15} />
            </span>
            <select
              id="reg-location"
              value={values.location}
              onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
            >
              <option value="">Select district / zone</option>
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:bg-emerald-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>Register Agency Account</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}