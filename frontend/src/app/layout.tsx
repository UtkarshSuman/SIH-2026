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
  title: "SIH Project",
  description: "Smart India Hackathon project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
  src="http://localhost:3000/widget.js"
  data-chatbot-id="cmtoygv8z0007eg10fpw72nij"
  data-api-key="sk_live_2e614e9bf29e289979297d555d6a44dd9bcb4360ebcf1171"
  data-api-base="http://localhost:3000">
</script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}