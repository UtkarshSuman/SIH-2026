import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rescue Arc — Hazard Red Zone Identification & Relocation Intelligence",
  description:
    "Intelligent identification of hazard-based red zones, carrying capacity assessment, and immediate relocation needs for vulnerable habitations. SIH Problem 26191.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          src={`${process.env.NEXT_PUBLIC_CHATBOT_API_BASE}/widget.js`}
          data-chatbot-id={process.env.NEXT_PUBLIC_CHATBOT_ID}
          data-api-key={process.env.NEXT_PUBLIC_CHATBOT_API_KEY}
          data-api-base={process.env.NEXT_PUBLIC_CHATBOT_API_BASE}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}