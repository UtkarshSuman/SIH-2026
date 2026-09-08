/**
 * FEATURE: Type-safe environment variables.
 * INSTALLATION: npm install @t3-oss/env-nextjs zod (already installed)
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BACKEND2_URL: z.string().url().default("http://localhost:8000"),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    REQUIRE_EMAIL_VERIFICATION: z
      .string()
      .default("false")
      .transform((v) => v === "true"),
    BREVO_API_KEY: z.string().min(1).optional(),
    BREVO_SENDER_EMAIL: z.string().email().optional(),
    BREVO_SENDER_NAME: z.string().min(1).optional(),
    FAST2SMS_API_KEY: z.string().min(1).optional(),
    ML_SERVICE_URL: z.string().url().optional(),
    ML_SERVICE_API_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_ML_SERVICE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BACKEND2_URL: process.env.BACKEND2_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION,
    NEXT_PUBLIC_ML_SERVICE_URL: process.env.NEXT_PUBLIC_ML_SERVICE_URL,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL,
    ML_SERVICE_API_KEY: process.env.ML_SERVICE_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
});
