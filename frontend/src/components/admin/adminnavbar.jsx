"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  Map,
  BarChart3,
  Users,
  FileText,
  ShieldCheck,
  Bell,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    icon: Home,
    active: true,
  },
  {
    name: "Red Zone Map",
    icon: Map,
  },
  {
    name: "Analysis",
    icon: BarChart3,
  },
  {
    name: "Settlements",
    icon: Users,
  },
  {
    name: "Reports",
    icon: FileText,
  },
  {
    name: "Authorities",
    icon: ShieldCheck,
  },
];

export default function Adminnavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-slate-200 bg-white">
      {/* ===============================
          DESKTOP NAVBAR
      ================================ */}
      <div className="mx-auto hidden h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:flex lg:px-12">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50">
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              fill
              priority
              sizes="44px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center leading-none">
            <h1 className="text-[20px] font-extrabold tracking-[-0.8px] text-slate-950 sm:text-[23px]">
              Rescue <span className="text-emerald-600">Arc</span>
            </h1>

            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[1.5px] text-emerald-800">
              HAZARD RED ZONE HUB
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <div className="flex h-full items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                type="button"
                className={`relative inline-flex h-full items-center gap-2 px-3 xl:px-4 text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${
                  item.active
                    ? "text-emerald-700"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.name}</span>

                {item.active && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-3 xl:gap-4 shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/70 text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} className="shrink-0" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white shadow-2xs">
              3
            </span>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 shrink-0" />

          {/* Admin User Chip */}
          <div className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-1.5 pr-3 transition-colors hover:bg-slate-100/70 cursor-pointer">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white shadow-2xs shrink-0">
              A
            </div>

            <div className="flex flex-col justify-center text-left leading-none">
              <p className="text-xs font-bold text-slate-900">Admin</p>
              <p className="mt-0.5 text-[9px] font-medium text-slate-500">System Administrator</p>
            </div>

            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-0.5" />
          </div>
        </div>
      </div>

      {/* ===============================
          MOBILE NAVBAR
      ================================ */}
      <div className="flex h-[64px] items-center justify-between px-4 sm:px-6 lg:hidden">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50">
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center leading-none">
            <h1 className="text-lg font-bold text-slate-950">
              Rescue <span className="text-emerald-600">Arc</span>
            </h1>

            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-800">
              HAZARD RED ZONE HUB
            </p>
          </div>
        </Link>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ===============================
          MOBILE MENU
      ================================ */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 lg:hidden">
          <div className="space-y-1 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                    item.active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Admin Profile */}
          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 font-bold text-xs text-white shrink-0">
              A
            </div>

            <div className="flex flex-col justify-center leading-none">
              <p className="text-xs font-bold text-slate-900">Admin</p>
              <p className="mt-0.5 text-[10px] text-slate-500">System Administrator</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
