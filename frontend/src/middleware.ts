/**
 * FEATURE: Route protection using v4's `withAuth` helper - any path under
 * /dashboard requires a logged-in session. withAuth automatically
 * redirects unauthenticated visitors to /login with a callbackUrl query
 * param, so they land back where they intended after signing in.
 * INSTALLATION: none - withAuth is built into next-auth.
 *
 * FUTURE RECOMMENDATION: when Phase 3/4 add the ML tool and chatbot pages,
 * add their path prefixes to the `matcher` array below - that's what makes
 * "use the chatbot -> must log in first" work.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};