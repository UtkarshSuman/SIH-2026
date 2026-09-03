/**
 * FEATURE: Signup form, rendered inside AuthCard's left panel. On success,
 * shows an inline "check your email" confirmation INSTEAD of auto-login -
 * since REQUIRE_EMAIL_VERIFICATION can be toggled true in production, the
 * form doesn't assume login will work immediately. If verification is off
 * (default, easier for local testing), the user can still just switch to
 * the Login side of the card and sign in right away.
 *
 * INSTALLATION: npm install zod
 *   (already in frontend/package.json)
 *
 * FUTURE RECOMMENDATION: add a password-strength indicator, and a "resend
 * verification email" button on this success state.
 */
"use client";

import { useState } from "react";
import { registerSchema, type RegisterFormValues } from "@/lib/validators";
import { locations } from "@/data/location";

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>({ name: "", email: "", password: "", mobileNumber: "", location: "", });
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
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1">
          We sent a verification link to <span className="font-medium">{submittedEmail}</span>.
          Click it, then switch to the Log in side to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">Full name</label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
          required
        />
      </div>

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
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mobileNumber" className="text-sm font-medium">
          Mobile number <span className="text-foreground/40">(optional)</span>
        </label>
        <input
          id="mobileNumber"
          type="tel"
          value={values.mobileNumber}
          onChange={(e) => setValues((v) => ({ ...v, mobileNumber: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="10-digit mobile number"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium">
          Location <span className="text-foreground/40">(optional)</span>
        </label>
        <select
          id="location"
          value={values.location}
          onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">Select your location</option>
          {locations.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}