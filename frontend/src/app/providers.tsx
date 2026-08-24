/**
 * FEATURE: Client-side wrapper around NextAuth's SessionProvider. This
 * MUST be its own "use client" file rather than being used directly
 * inside layout.tsx (a Server Component) - rendering a context-providing
 * client component directly inside a server file is what causes the
 * "React Context is unavailable in Server Components" error. Isolating
 * it here gives Next.js a clean client/server boundary.

 */
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}