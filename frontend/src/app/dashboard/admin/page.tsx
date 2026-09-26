/**
 * FEATURE: Admin dashboard - user management and relocation capacity control
 */
"use client";

import Link from "next/link";
import { trpc } from "@/components/dashboard/trpc-provider";

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function AdminDashboard() {
  const { data: users, isLoading } = trpc.user.listAll.useQuery();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Disaster Management Administration Portal
          </h1>
          <p className="text-xs text-foreground/60">
            Control center for NDMA/DDMA emergency officials, user roles, and relocation capacity planning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/alerts"
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
          >
            🚨 Alert Testing &amp; Simulation Lab →
          </Link>

          <Link
            href="/admin/relocation-sites"
            className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Manage Relocation Sites &amp; Capacities →
          </Link>
        </div>
      </div>

      {/* Relocation Capacity Card */}
      <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Sphere Standard Relocation
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Candidate Shelters &amp; Carrying Capacities
            </h2>
            <p className="mt-1 text-xs text-foreground/60 max-w-xl">
              Modify allowable evacuee capacities, usable land area, and water/medical readiness for all safe townships in the database.
            </p>
          </div>
          <Link
            href="/admin/relocation-sites"
            className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Open Capacity Editor ↗
          </Link>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-3">Registered Officials &amp; Citizens</h2>
        {isLoading ? (
          <p className="text-sm text-foreground/60">Loading users...</p>
        ) : (
          <table className="w-full max-w-3xl text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-foreground/60">
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Email</th>
                <th className="py-2.5">Role</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: AdminUserRow) => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-2.5 font-medium">{u.name ?? "—"}</td>
                  <td className="py-2.5 text-foreground/80">{u.email}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}