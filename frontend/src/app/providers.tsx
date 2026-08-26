/**
 * FEATURE: All client-side context providers, PLUS the globally-mounted
 * ChatWidget (moved here from dashboard/layout.tsx so it shows on every
 * page, not just /dashboard).
 * INSTALLATION: none beyond what's already installed.
 */
"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/components/dashboard/trpc-provider";
import { ChatWidget } from "@/components/chat/chat-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
        <ChatWidget />
      </TRPCProvider>
    </SessionProvider>
  );
}