"use client";

import React, { useState } from "react";
import Link from "next/link";

function PhoneCallIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-24 scroll-mt-16 bg-white text-slate-800 border-b border-emerald-200/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 shadow-xs mb-4">
            <PhoneCallIcon size={16} className="text-amber-700" /> Emergency Hotline & Authority Contact
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Connect with <span className="text-emerald-700">Rescue Arc Command</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Reach out for red zone assessment integration, district carrying capacity onboarding, or technical assistance with relocation planning.
          </p>
        </div>

        {/* CONTACT GRID */}
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-12 items-start max-w-5xl mx-auto">
          
          {/* NDRF EMERGENCY HOTLINE CARD */}
          <div className="lg:col-span-5 rounded-3xl border border-amber-300 bg-amber-50/80 p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                24x7 Emergency Operations
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-4">NDMA National Emergency Hotline</h3>
              <p className="text-xs text-slate-700 leading-relaxed mt-2">
                For active disaster emergencies or urgent red zone relocation coordination requiring National Disaster Management Authority response:
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <a
                href="tel:1078"
                className="flex items-center gap-3 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-4 text-sm font-bold text-white shadow-md transition-all"
              >
                <PhoneCallIcon size={20} />
                <div>
                  <div className="text-[10px] text-amber-100 uppercase tracking-widest font-semibold">Toll-Free Helpline</div>
                  <div>NDMA Hotline: 1078</div>
                </div>
              </a>

              <div className="rounded-2xl border border-amber-200 bg-white p-4 text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>National Emergency Response:</span>
                <span className="font-extrabold text-amber-900 text-sm">112</span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-950 flex items-center justify-between">
                <span>Disaster Command Email:</span>
                <span className="font-extrabold text-emerald-900 text-xs">control@rescuearc.in</span>
              </div>
            </div>
          </div>

          {/* AGENCY ONBOARDING FORM */}
          <div className="lg:col-span-7 rounded-3xl border border-emerald-200 bg-white p-8 shadow-md">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Authority & District Contact Form</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              District collectors, DDMA officers, GSI officials, and state disaster management teams can contact our engineering team for red zone assessment integration.
            </p>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center text-xs font-bold text-emerald-950">
                ✓ Thank you! Your request has been transmitted to Rescue Arc Command Control.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Name / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. District Collector Office / DDMA Cell"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="official@gov.in"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message / Assessment Request</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Specify red zone assessment area, settlement carrying capacity query, or relocation planning request..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <MailIcon size={16} /> Send Dispatch Request
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
