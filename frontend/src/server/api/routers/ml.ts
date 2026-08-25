/**
 * FEATURE: tRPC router wrapping the ML service call - demonstrates the
 * bridge working end-to-end (Next.js -> tRPC -> ml-client -> FastAPI).
 * INSTALLATION: none beyond Phase 2's tRPC setup.
 */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { predict } from "@/server/services/ml-client";

export const mlRouter = createTRPCRouter({
  predict: protectedProcedure
    .input(z.object({ modelName: z.string(), input: z.record(z.string(), z.unknown()) }))
    .mutation(({ input }) => predict(input.modelName, input.input)),
});