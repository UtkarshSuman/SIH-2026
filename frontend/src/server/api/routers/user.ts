/**
 * FEATURE: Example tRPC router - demonstrates the full pattern (query +
 * mutation + role-gated query) your teammates will copy for new features.
 *   - me: returns the logged-in user's own profile
 *   - updateProfile: lets a user change their own name
 *   - listAll: ADMIN-ONLY - lists every user, proves adminProcedure works
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  listAll: adminProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});