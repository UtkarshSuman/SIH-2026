/**
 * FEATURE: Standalone "forgot password" page - simpler single-panel
 * layout (no split card, since there's no second form to switch to here).
 * Reached via the "Forgot password?" link inside login-form.
 */
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link href="/login" className="text-sm text-primary hover:underline">
        Back to login
      </Link>
    </main>
  );
}