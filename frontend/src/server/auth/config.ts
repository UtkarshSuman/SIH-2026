/**
 * auth/config.ts
 *
 * NextAuth v4 configuration — Credentials (email + password) login.
 * Uses Supabase REST API via auth-rest-client.ts (HTTPS/443).
 * Does NOT use Prisma (direct PostgreSQL ports 5432/6543 are blocked).
 *
 * Roles: CITIZEN (default) | DEPARTMENT_OFFICIAL | ADMIN | SUPER_ADMIN
 * Admin account: teamsih12@gmail.com / 12345678
 */
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/auth-rest-client";
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

        let user;
        try {
          user = await findUserByEmail(parsed.data.email);
        } catch (err) {
          console.error("[Auth] Database lookup failed:", err);
          return null;
        }

        if (!user?.password_hash) return null; // no password = OAuth-only

        const passwordValid = await bcrypt.compare(parsed.data.password, user.password_hash);
        if (!passwordValid) return null;

        if (env.REQUIRE_EMAIL_VERIFICATION && !user.email_verified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: !!user.email_verified,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = Boolean(user.emailVerified);
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