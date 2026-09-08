"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "NDRF Authorities", href: "#authorities" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only run intersection observer on marketing home page
    if (pathname !== "/" && pathname !== "") return;

    const sectionIds = ["home", "authorities", "features", "how-it-works", "about", "impact", "contact"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const handleNavClick = (e, href) => {
    if (pathname === "/" || pathname === "") {
      e.preventDefault();
      const targetId = href.replace("#", "").replace("/#", "");
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${targetId}`);
        setActiveSection(targetId);
        setMobileMenuOpen(false);
      }
    } else {
      // If we are on another route (e.g. /login), navigate to /#section
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        border-b
        border-emerald-900/10
        bg-white/95
        backdrop-blur-md
        shadow-xs
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          w-full
          max-w-[1500px]
          items-center
          px-5
          sm:px-8
          lg:px-12
        "
      >
        {/* LOGO + BRAND */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, "#home")}
          className="
            group
            flex
            shrink-0
            items-center
            gap-3
          "
        >
          <div
            className="
              relative
              h-[44px]
              w-[44px]
              shrink-0
              overflow-hidden
              rounded-xl
              border border-emerald-200
              bg-emerald-50
              p-1
              shadow-sm
            "
          >
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              fill
              priority
              sizes="44px"
              className="
                object-cover
                rounded-lg
                transition-transform
                duration-300
                group-hover:scale-105
              "
            />
          </div>

          <div className="flex flex-col">
            <span
              className="
                text-xl
                font-extrabold
                leading-none
                tracking-tight
                text-slate-900
              "
            >
              Rescue <span className="text-emerald-700">Arc</span>
            </span>

            <span
              className="
                mt-1
                text-[9px]
                font-bold
                uppercase
                tracking-widest
                text-emerald-800/80
              "
            >
              NDRF & Forest Response Hub
            </span>
          </div>
        </a>

        {/* DESKTOP NAVIGATION LINKS */}
        <div
          className="
            ml-auto
            mr-6
            hidden
            items-center
            gap-5
            md:flex
            lg:mr-8
            lg:gap-6
          "
        >
          {navItems.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;
            const targetHref = pathname === "/" || pathname === "" ? item.href : `/${item.href}`;

            return (
              <a
                key={item.href}
                href={targetHref}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`
                  group
                  relative
                  whitespace-nowrap
                  py-2
                  text-xs
                  font-semibold
                  transition-colors
                  duration-300
                  ${isActive ? "text-emerald-800 font-bold" : "text-slate-700 hover:text-emerald-800"}
                `}
              >
                {item.label}
                <span
                  className={`
                    absolute
                    bottom-0
                    left-0
                    h-[2px]
                    rounded-full
                    bg-emerald-600
                    transition-all
                    duration-300
                    ${isActive ? "w-full" : "w-0 group-hover:w-full"}
                  `}
                />
              </a>
            );
          })}
        </div>

        {/* RIGHT ACTIONS */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-2 sm:gap-3
          "
        >
          {/* NDRF Emergency Phone Button */}
          <a
            href="tel:1078"
            className="
              hidden
              sm:flex
              items-center
              gap-2
              rounded-full
              border border-amber-300
              bg-amber-50
              px-3.5
              py-1.5
              text-xs
              font-bold
              text-amber-900
              shadow-xs
              transition-all
              duration-300
              hover:bg-amber-100
            "
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            NDRF 1078
          </a>

          {/* Login */}
          <Link
            href="/login"
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3.5 sm:px-4
              py-2
              text-xs
              font-semibold
              text-slate-800
              transition-all
              duration-300
              hover:border-emerald-300
              hover:bg-emerald-50
            "
          >
            Login
          </Link>

          {/* Sign Up */}
          <Link
            href="/register"
            className="
              rounded-xl
              bg-emerald-700
              px-4 sm:px-4.5
              py-2
              text-xs
              font-bold
              text-white
              shadow-sm
              transition-all
              duration-300
              hover:bg-emerald-800
              hover:shadow-md
            "
          >
            Sign Up
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-1 p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 12h16M4 6h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white/98 px-5 py-4 shadow-lg">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const targetHref = pathname === "/" || pathname === "" ? item.href : `/${item.href}`;
              return (
                <a
                  key={item.href}
                  href={targetHref}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="py-2 text-sm font-semibold text-slate-800 hover:text-emerald-800 border-b border-slate-100"
                >
                  {item.label}
                </a>
              );
            })}
            <a
              href="tel:1078"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              Call NDRF Helpline 1078
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
