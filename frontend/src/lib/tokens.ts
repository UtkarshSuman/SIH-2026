/**
 * FEATURE: Shared helpers for generating the one-time tokens used by email
 * verification and password reset links. Centralized here so both features
 * generate tokens the same (cryptographically random, not guessable) way.
 * INSTALLATION: none - `crypto` is a built-in Node.js module, no package needed.
 */
import { randomBytes } from "crypto";

/** 64-character random hex string - used as the ?token= value in email links. */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}