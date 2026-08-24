/**
 * FEATURE: Shared header for every /dashboard/* page - shows the logged-in
 * user's email, a role badge, and a logout button. Rendered once in
 * dashboard/layout.tsx so individual dashboard pages don't repeat it.
 */
"use client";

import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-border p-4">
      <span className="font-semibold">SIH Project</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {session?.user?.role}
        </span>
        <span className="text-foreground/60">{session?.user?.email}</span>
        <LogoutButton />
      </div>
    </header>
  );
}