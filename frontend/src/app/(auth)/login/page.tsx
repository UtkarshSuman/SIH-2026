/**
 * FEATURE: The single route that hosts the split auth-card for BOTH login
 * and register. `?mode=register` in the URL opens it directly on the
 * signup side; otherwise it defaults to the login side.
 *
 * RESPONSIVE: outer wrapper centers the card with edge padding on mobile
 * (`p-4`) so the card never touches the screen edges on small devices.
 */
import { AuthCard } from "@/components/auth/auth-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "register" ? "register" : "login";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthCard initialMode={initialMode} />
    </main>
  );
}