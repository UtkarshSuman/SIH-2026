/**
 * FEATURE: The single split-card auth container used by both /login and
 * /register. Left side shows LoginForm or RegisterForm depending on
 * `mode`, with a text link at the bottom that switches modes WITHOUT a
 * full page navigation (just swaps which form renders + updates the URL
 * so refreshing keeps you on the same mode). Right side is the static
 * AuthVisualPanel (image/animation placeholder). A cross (X) button in the
 * top-right corner sends the user straight back to the home page.
 *
 * RESPONSIVE:
 *   - Mobile (<640px): card is full-width, visual panel hidden, form
 *     panel gets full padding.
 *   - Tablet (640-768px): card gets a max-width and centers, visual panel
 *     still hidden (not enough room for it to look good).
 *   - Laptop (>=768px, `md:`): full split card, both panels visible.
 *
 * INSTALLATION: npm install lucide-react   (for the X icon - already in
 *   frontend/package.json)
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AuthVisualPanel } from "./auth-visual-panel";
import type { AuthMode } from "@sih/types";

export function AuthCard({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function switchMode(next: AuthMode) {
    setMode(next);
    // Keep the URL in sync (e.g. /login -> /login?mode=register) so a
    // refresh or shared link lands on the same form, without a full
    // Next.js navigation/re-render of the page.
    const url = next === "register" ? "/login?mode=register" : "/login";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="relative flex w-full max-w-3xl overflow-hidden rounded-xl border border-border shadow-lg md:h-[520px]">
      <Link
        href="/"
        aria-label="Close and return to home"
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-foreground/60 hover:bg-black/5"
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      >
        <X size={20} />
      </Link>

      {/* Left panel - form. Full width on mobile, half width from md: up. */}
      <div className="flex w-full flex-col justify-center gap-6 bg-background p-6 sm:p-10 md:w-1/2">
        {mode === "login" ? (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Log in</h1>
              <p className="mt-1 text-sm text-foreground/60">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
            <LoginForm />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Create an account</h1>
              <p className="mt-1 text-sm text-foreground/60">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
            <RegisterForm />
          </>
        )}
      </div>

      <AuthVisualPanel />
    </div>
  );
}