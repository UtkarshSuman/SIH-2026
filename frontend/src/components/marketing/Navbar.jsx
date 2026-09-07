"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Impact", href: "/impact" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        border-b
        border-white/[0.08]
        bg-[#061b10]/25
        backdrop-blur-md
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[68px]
          w-full
          max-w-[1500px]
          items-center
          px-7
          lg:px-9
        "
      >
        {/* =====================================================
            LOGO + BRAND
        ====================================================== */}
        <Link
          href="/"
          className="
            group
            flex
            shrink-0
            items-center
            gap-3
          "
        >
          {/* Your Rescue Arc Logo */}
          <div
            className="
              relative
              h-[48px]
              w-[48px]
              shrink-0
              overflow-hidden
              rounded-full
              bg-transparent
            "
          >
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc"
              fill
              priority
              sizes="48px"
              className="
                object-contain
                transition-transform
                duration-300
                group-hover:scale-105
              "
            />
          </div>

          {/* Brand */}
          <div className="flex flex-col">
            <span
              className="
                text-[21px]
                font-bold
                leading-none
                tracking-[-0.035em]
                text-white
              "
            >
              Rescue <span className="text-[#aaf27d]">Arc</span>
            </span>

            <span
              className="
                mt-1
                text-[8px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-white/35
              "
            >
              Safer Communities, Stronger Tomorrow
            </span>
          </div>
        </Link>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}
        <div
          className="
            ml-auto
            mr-8
            hidden
            items-center
            gap-7
            md:flex
            lg:mr-10
            lg:gap-8
          "
        >
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group
                  relative
                  whitespace-nowrap
                  py-2.5
                  text-[12px]
                  font-semibold
                  transition-colors
                  duration-300
                  ${
                    active ? "text-[#aaf27d]" : "text-white/60 hover:text-white"
                  }
                `}
              >
                {item.label}

                {/* Active underline */}
                <span
                  className={`
                    absolute
                    bottom-0
                    left-1/2
                    h-[2px]
                    -translate-x-1/2
                    rounded-full
                    bg-[#aaf27d]
                    transition-all
                    duration-300
                    ${
                      active
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-70"
                    }
                  `}
                />
              </Link>
            );
          })}
        </div>

        {/* =====================================================
            RIGHT ACTIONS
        ====================================================== */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-2.5
          "
        >
          {/* Login */}
          <Link
            href="/login"
            className="
              rounded-xl
              border
              border-white/[0.14]
              bg-white/[0.025]
              px-6
              py-2.5
              text-[12px]
              font-semibold
              text-white/85
              transition-all
              duration-300
              hover:border-[#aaf27d]/40
              hover:bg-white/[0.06]
              hover:text-white
            "
          >
            Login
          </Link>

          {/* Sign Up */}
          <Link
            href="/register"
            className="
              rounded-xl
              bg-[#aaf27d]
              px-6
              py-2.5
              text-[12px]
              font-bold
              text-[#102918]
              transition-all
              duration-300
              hover:bg-[#baf58f]
              hover:-translate-y-[1px]
            "
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
