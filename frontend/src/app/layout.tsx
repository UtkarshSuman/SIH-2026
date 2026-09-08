/**
 * FEATURE: Root layout - wraps every page in the Providers client
 * component (see providers.tsx) so `useSession()` works in any client
 * component (e.g. a future header showing "Logged in as X").
 * INSTALLATION: none.
 *
 * FUTURE RECOMMENDATION (Phase 4): this is also where the global RAG
 * chat widget will be mounted once it's built.
 */
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rescue Arc — Hazard Red Zone Identification & Relocation Intelligence",
  description: "Intelligent identification of hazard-based red zones, carrying capacity assessment, and immediate relocation needs for vulnerable habitations. SIH Problem 26191.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}