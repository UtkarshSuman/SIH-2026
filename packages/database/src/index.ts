/**
 * FEATURE: Singleton Prisma client - shared by every server-side file
 * that needs the database. Prevents exhausting Postgres connections
 * during Next.js dev hot-reload (each reload would otherwise create a
 * fresh PrismaClient instance).
 * INSTALLATION: none - @prisma/client is already a dependency of this
 * package; run `pnpm db:generate` once before first use.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";