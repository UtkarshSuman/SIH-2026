/**
 * FEATURE: tRPC backbone - defines the base procedure types every feature
 * router builds on:
 *   - publicProcedure: no auth required
 *   - protectedProcedure: requires a logged-in session
 *   - adminProcedure: requires ADMIN or SUPER_ADMIN role
 * New feature routers (Phase 3's ML predictions, Phase 4's chat history,
 * etc.) import one of these three instead of writing their own auth checks.
 * INSTALLATION: npm install @trpc/server zod superjson
 *   (already added to frontend/package.json above)
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});