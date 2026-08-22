/**
 * FEATURE: Placeholder protected page - proves middleware + session +
 * email-verified status all work end-to-end under NextAuth v4.
 * INSTALLATION: none - uses authOptions already configured.
 *
 * FUTURE (Phase 2): replaced by real role-specific dashboards.
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/config";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>
        Logged in as {session.user.email} (role: {session.user.role})
      </p>

      {!session.user.emailVerified && (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Your email isn&apos;t verified yet - check your inbox for the verification link.
        </p>
      )}

      <LogoutButton />
    </main>
  );
}