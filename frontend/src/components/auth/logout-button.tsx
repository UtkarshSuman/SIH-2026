/**
 * FEATURE: Logout button. v4's signOut must be called client-side (unlike
 * v5, there's no server-action-friendly signOut export from authOptions),
 * so this is a small dedicated client component the dashboard page renders.
 * INSTALLATION: none - signOut comes from next-auth/react, already installed.
 */
"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-md border border-border px-4 py-2 text-sm"
    >
      Log out
    </button>
  );
}