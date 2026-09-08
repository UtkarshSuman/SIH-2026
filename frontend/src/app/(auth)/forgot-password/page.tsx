import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f4fbf7] via-white to-[#f0fdf4] px-4 py-8 font-sans text-slate-800 flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950">
      {/* BACKGROUND PATTERN */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.035]"
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* TOP HEADER */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-2 sm:px-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-1 shadow-sm">
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              fill
              priority
              sizes="40px"
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-slate-900">
              Rescue <span className="text-emerald-700">Arc</span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-800/80">
              NDRF & Forest Response Hub
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 transition-all"
        >
          <span>&larr;</span> Back to Login
        </Link>
      </header>

      {/* CARD */}
      <section className="relative z-10 mx-auto my-auto w-full max-w-md rounded-3xl border border-emerald-200/80 bg-white p-8 shadow-xl shadow-emerald-950/10">
        <div className="mb-6">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-3">
            Credential Recovery
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Reset Account Password</h1>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Enter your official agency email and we will dispatch a secure password reset link to your inbox.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs">
          <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
            &larr; Return to Sign In
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between text-[11px] text-slate-500 pt-4">
        <span>© {new Date().getFullYear()} Rescue Arc</span>
        <span>NDRF Emergency Helpline: 1078</span>
      </footer>
    </main>
  );
}