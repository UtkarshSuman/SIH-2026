/**
 * FEATURE: /dashboard index - redirects to the correct role-specific
 * dashboard. Nothing renders here directly.
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/config";

export const metadata = {
  title: "Rescue Arc GIS Dashboard",
  description:
    "Multi-hazard red-zone identification and relocation decision-support system",
};

export default function DashboardPage() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <iframe
        src="/dashboard.html"
        title="Rescue Arc GIS Dashboard"
        className="w-full h-full border-0"
      />
    </main>
  );
}