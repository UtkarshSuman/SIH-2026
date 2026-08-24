/**
 * FEATURE: Citizen dashboard - placeholder + a working tRPC example
 * (edit your own name via user.updateProfile). Replace the placeholder
 * content with real citizen-facing features once the problem statement
 * is picked.
 */
"use client";

import { useState } from "react";
import { trpc } from "@/components/dashboard/trpc-provider";

export default function CitizenDashboard() {
  const { data: user, refetch } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => refetch(),
  });
  const [name, setName] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Citizen dashboard</h1>
      <p className="text-sm text-foreground/60">Current name: {user?.name ?? "—"}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) updateProfile.mutate({ name: name.trim() });
        }}
        className="flex max-w-sm gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New name"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {updateProfile.isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}