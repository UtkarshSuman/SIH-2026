/**
 * FEATURE: Shared layout for every /dashboard/* route - renders the
 * DashboardHeader above whichever role-specific page is active.
 */
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="p-6">{children}</main>
    </div>
  );
}