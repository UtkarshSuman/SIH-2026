/**
 * FEATURE: Sticky top navbar. Shows a "Login" button for logged-out
 * visitors; shows a "Dashboard" link + logout for logged-in users. This
 * is the primary entry point into the auth-card now  -
 * the old hero-section login/signup buttons are gone in favor of this.
 */
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-8">
      <Link href="/" className="font-semibold">
        SIH Project
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="rounded-md border border-border px-3 py-1.5">
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-foreground/60 hover:text-foreground"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Login
        </Link>
      )}
    </nav>
  );
}