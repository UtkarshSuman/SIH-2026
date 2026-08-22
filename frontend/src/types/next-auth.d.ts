/**
 * FEATURE: Extends NextAuth v4's Session/User/JWT types with our custom
 * `id`, `role`, `emailVerified` fields. Both "next-auth" (Session, User)
 * AND "next-auth/jwt" (JWT) need augmenting in v4 - missing the JWT one
 * is what causes "role"/"emailVerified" to error inside the jwt() callback.
 * INSTALLATION: none - type-only file, no runtime package needed.
 */
import type { DefaultSession } from "next-auth";
import type { UserRole } from "@sih/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    emailVerified: boolean;
  }
}