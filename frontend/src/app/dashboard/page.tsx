/**
 * FEATURE: /dashboard index - redirects to the correct role-specific
 * dashboard. Nothing renders here directly.
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/config";

export default async function DashboardIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      redirect("/dashboard/admin");
    case "DEPARTMENT_OFFICIAL":
      redirect("/dashboard/official");
    default:
      redirect("/dashboard/citizen");
  }
}