/**
 * FEATURE: /register no longer has its own form - it just opens the same
 * auth-card as /login, pre-set to the registration side. Kept as a route
 * so any old bookmarks/links to /register still work correctly.
 */
import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/login?mode=register");
}