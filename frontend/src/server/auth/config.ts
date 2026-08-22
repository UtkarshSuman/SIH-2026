/**
 * FEATURE: Auth.js (NextAuth v4) configuration - Credentials (email +
 * password) login, JWT/session callbacks that attach `id`, `role`, and
 * `emailVerified`. v4 exports one `authOptions` object (not the v5-style
 * destructured helpers) - every other file that needs the session imports
 * this `authOptions` and passes it to NextAuth's own functions.
 *
 * INSTALLATION: npm install next-auth@^4.24.14 bcryptjs
 *   (already in frontend/package.json)
 *
 * FUTURE RECOMMENDATION: add OAuth providers (Google/GitHub) to the
 * `providers` array below - they compose with Credentials with no other
 * changes needed anywhere else in the app.
 */
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@sih/database";
import { loginSchema } from "@/lib/validators";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null; // no password set = OAuth-only account

        const passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) return null;

        if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: !!user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};