/**
 * FEATURE: Public landing page. CTA links point straight at the split
 * auth-card (/login for sign-in side, /login?mode=register for the signup
 * side) - there's no separate marketing-styled register page anymore,
 * per the single-card design.
 *
 * RESPONSIVE: buttons stack full-width on mobile (`flex-col`) and sit
 * side-by-side from `sm:` up.
 */
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">SIH Project</h1>
      <p className="max-w-md text-sm text-foreground/70">
        Phase 1: authentication foundation with email verification and
        password reset. Sign up or log in to reach the protected dashboard.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/login"
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Log in
        </Link>
        <Link
          href="/login?mode=register"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}