"use client";

import { useState } from "react";

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

      <div className="hidden min-h-[76px] items-center px-8 lg:flex">
        {/* Logo */}
        <div className="flex min-w-[250px] items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-xl">
            <img
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#0b1838]">
              Rescue <span className="text-emerald-600">Arc</span>
            </h1>

            <p className="text-[10px] font-medium tracking-wider text-emerald-700">
              HAZARD RED ZONE HUB
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex h-full flex-1 items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`relative flex h-[76px] items-center gap-2 px-4 text-sm font-medium transition ${
                  item.active
                    ? "text-emerald-700"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                <Icon size={21} />

                {item.name}

                {item.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell size={23} className="text-slate-700" />

            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="h-9 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 font-semibold text-white">
              A
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Admin</p>

              <p className="text-xs text-slate-500">System Administrator</p>
            </div>

            <ChevronDown size={17} />
          </div>
        </div>
      </div>

      {/* ===============================
          MOBILE NAVBAR
      ================================ */}

      <div className="flex min-h-[64px] items-center justify-between px-4 lg:hidden">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 overflow-hidden rounded-xl">
            <img
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-[#0b1838]">
              Rescue <span className="text-emerald-600">Arc</span>
            </h1>

            <p className="text-[8px] font-medium tracking-wider text-emerald-700">
              HAZARD RED ZONE HUB
            </p>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell size={21} className="text-slate-700" />

            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    item.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={19} />

                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Mobile Admin */}
          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 font-semibold text-white">
              A
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Admin</p>

              <p className="text-xs text-slate-500">System Administrator</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
