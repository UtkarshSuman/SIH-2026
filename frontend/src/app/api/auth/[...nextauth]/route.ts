/**
 * FEATURE: Wires NextAuth v4's handler into the App Router. v4's NextAuth()
 * call itself returns the request handler (unlike v5, which returns a
 * `{ handlers }` object) - so this file is shorter than the v5 version.
 * INSTALLATION: none beyond what server/auth/config.ts already needs.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/server/auth/config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };