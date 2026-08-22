/**
 * FEATURE: Next.js build configuration.
 *
 * `transpilePackages` is the one addition beyond create-next-app's default:
 * it's required because @sih/database and @sih/types are TypeScript source
 * (not pre-built), living in sibling workspace packages - this tells
 * Next.js's bundler to compile them too, not just code inside frontend/.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sih/database", "@sih/types"],
};

export default nextConfig;