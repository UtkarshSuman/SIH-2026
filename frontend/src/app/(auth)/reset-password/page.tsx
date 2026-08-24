/**
 * FEATURE: Standalone "set new password" page, reached via the emailed
 * reset link (?token=xxx). Reads the token from the URL and hands it to
 * reset-password-form; if the token is missing entirely, shows an error
 * instead of rendering a form that can't work.
 */
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
      </div>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          This reset link is missing its token. Request a new one from the
          forgot password page.
        </p>
      )}
    </main>
  );
}