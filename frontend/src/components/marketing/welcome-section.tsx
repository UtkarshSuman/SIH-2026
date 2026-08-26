/**
 * FEATURE: The "logged-in only" section on the marketing page
 *Renders nothing for logged-out visitors. Content and
 * CTA destinations are placeholders - swap the text and the second
 * button's href once you decide whether this should point at the
 * dashboard, the ML tool, or both.
 */
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function WelcomeSection() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <section className="border-y border-border bg-primary/5 px-4 py-10 text-center sm:px-8">
      <h2 className="text-xl font-semibold">
        Welcome back, {session.user.name ?? session.user.email}
      </h2>

      {/* PLACEHOLDER: decide later whether this points to the dashboard,
          the ML tool, or both - update text + links below. */}
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
        Placeholder text for the logged-in welcome section.
      </p>

      <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Go to Dashboard
        </Link>
        {/* PLACEHOLDER second CTA - point at the ML tool page once it exists */}
        <Link href="/dashboard" className="rounded-md border border-border px-4 py-2 text-sm">
          Try the ML Tool
        </Link>
      </div>
    </section>
  );
}