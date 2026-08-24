/**
 * FEATURE: tRPC context - built once per request, available in every
 * procedure as `ctx`. Currently just carries the NextAuth v4 session and
 * the Prisma client. Add new shared resources here (e.g. a Redis client)
 * as later phases need them.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { prisma } from "@sih/database";

export async function createContext() {
  const session = await getServerSession(authOptions);
  return { session, prisma };
}

export type Context = Awaited<ReturnType<typeof createContext>>;