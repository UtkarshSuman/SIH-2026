/**
 * FEATURE: All client-side context providers in one place - NextAuth
 * session + tRPC/React Query. Kept as its own "use client" file, separate
 * from the server-rendered layout.tsx, to avoid the "React Context is
 * unavailable in Server Components" error.
 */
"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/components/dashboard/trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </SessionProvider>
  );
}