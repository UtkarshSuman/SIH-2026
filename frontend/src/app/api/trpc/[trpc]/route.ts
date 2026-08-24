/**
 * FEATURE: Wires the tRPC router into a single Next.js API route - every
 * tRPC call (user.me, user.updateProfile, etc.) actually goes through
 * this one HTTP endpoint under the hood.

 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/routers";
import { createContext } from "@/server/api/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };