/**
 * FEATURE: Root tRPC router - register every new feature router here.
 * When Phase 3 adds ML predictions: `ml: mlRouter`. When Phase 4 adds
 * chat history: `chat: chatRouter`. One line each, nothing else changes.
 * INSTALLATION: none.
 */
import { createTRPCRouter } from "../trpc";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  user: userRouter,
});

export type AppRouter = typeof appRouter;