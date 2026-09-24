"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Live Map", href: "/#map" },
  { label: "Relocation", href: "/relocation" },
  { label: "Analytics", href: "/analytics" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Red Zone", href: "/redzone" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] w-full border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center px-5 sm:px-8 lg:px-12">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl">
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc logo"
              fill
              priority
              sizes="48px"
              className="object-cover"
            />
          </div>

          <div className="leading-none">
            <h1 className="text-[22px] font-extrabold tracking-[-0.8px] text-slate-950 sm:text-[25px]">
              Rescue <span className="text-emerald-700">Arc</span>
            </h1>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[1.7px] text-emerald-800 sm:text-[10px]">
              Hazard Red Zone Hub
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-1 py-2 text-[14px] font-medium transition-colors
                  ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-700 hover:text-emerald-700"
                  }
                  after:absolute after:bottom-0 after:left-0 after:h-[2px]
                  after:rounded-full after:bg-emerald-600
                  after:transition-all after:duration-200
                  ${isActive ? "after:w-full" : "after:w-0"}
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="ml-5 hidden items-center gap-3 lg:flex xl:ml-7">
          <a
            href="tel:1078"
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            ☎ NDMA 1078
          </a>

          <Link
            href="/login"
            className="rounded-lg px-2.5 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-emerald-700 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`border-b border-slate-100 py-3 text-sm font-medium ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-700 hover:text-emerald-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <a
              href="tel:1078"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900"
            >
              ☎ NDMA 1078
            </a>

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="mt-3 rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}