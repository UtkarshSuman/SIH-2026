"use client";

import { useState } from "react";
import { registerSchema, type RegisterFormValues } from "@/lib/validators";
import { locations } from "@/data/location";

function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
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
        setError(json.error.message);
        return;
      }

      setSubmittedEmail(values.email);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-xs text-emerald-950 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">✓</span>
          Account Created Successfully!
        </div>
        <p className="leading-relaxed text-slate-700">
          We sent a verification link to <strong className="text-emerald-900">{submittedEmail}</strong>.
          Please click it to activate your authority account, then switch to the Log in tab to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* FULL NAME */}
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-bold text-slate-700">
          Full Name / Officer Name
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <UserIcon />
          </span>
          <input
            id="name"
            type="text"
            placeholder="e.g. Commander Rajesh Kumar"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
      </div>

      {/* EMAIL */}
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-xs font-bold text-slate-700">
          Password
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <LockIcon />
          </span>
          <input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
      </div>

      {/* MOBILE NUMBER & LOCATION IN 2 COLUMNS ON SM */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="mobileNumber" className="text-xs font-bold text-slate-700">
            Mobile Number <span className="text-slate-400 font-normal">(SMS Alerts)</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <PhoneIcon />
            </span>
            <input
              id="mobileNumber"
              type="tel"
              value={values.mobileNumber}
              onChange={(e) => setValues((v) => ({ ...v, mobileNumber: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="+91 9876543210"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="location" className="text-xs font-bold text-slate-700">
            Assigned Disaster Zone
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <PinIcon />
            </span>
            <select
              id="location"
              value={values.location}
              onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
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
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Registering Agency Cell..." : "Create Authority Account"}
        {!loading && <ArrowRightIcon />}
      </button>
    </form>
  );
}