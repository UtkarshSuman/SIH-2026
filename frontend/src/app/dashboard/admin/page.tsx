/**
 * FEATURE: Admin dashboard - working example of an admin-only tRPC query
 * (user.listAll), proving role gating works end-to-end. A non-admin user
 * hitting this page's query gets a FORBIDDEN error from adminProcedure.
 */
"use client";

import { trpc } from "@/components/dashboard/trpc-provider";

export default function AdminDashboard() {
  const { data: users, isLoading } = trpc.user.listAll.useQuery();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Admin dashboard</h1>
      {isLoading ? (
        <p className="text-sm text-foreground/60">Loading users...</p>
      ) : (
        <table className="w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}