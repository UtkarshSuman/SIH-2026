/**
 * auth-rest-client.ts
 *
 * Supabase REST API wrapper for User auth operations.
 * Used by NextAuth and the register/forgot-password routes.
 * Bypasses blocked PostgreSQL ports by using HTTPS REST API.
 */

const SUPABASE_URL = "https://jxitjpimiompwifxguch.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao";

const HEADERS = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
};

export interface DbUser {
  id: string;
  name: string | null;
  email: string;
  email_verified: string | null;
  image: string | null;
  password_hash: string | null;
  role: "CITIZEN" | "DEPARTMENT_OFFICIAL" | "ADMIN" | "SUPER_ADMIN";
  mobile_number: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEmailVerificationToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface DbPasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// ============================================================
// Core helpers
// ============================================================

async function restGet<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`REST GET ${table} (${res.status}): ${t.substring(0, 200)}`);
  }
  return res.json();
}

async function restPost<T>(table: string, body: unknown, onConflict?: string): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`REST POST ${table} (${res.status}): ${t.substring(0, 200)}`);
  }
  return res.json();
}

async function restPatch<T>(table: string, filter: Record<string, string>, body: unknown): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(filter)) url.searchParams.set(k, `eq.${v}`);
  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`REST PATCH ${table} (${res.status}): ${t.substring(0, 200)}`);
  }
  return res.json();
}

// ============================================================
// User operations
// ============================================================

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await restGet<DbUser>("users", { email: `eq.${encodeURIComponent(email)}` });
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const rows = await restGet<DbUser>("users", { id: `eq.${id}` });
  return rows[0] ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  mobileNumber?: string | null;
  location?: string | null;
}): Promise<DbUser> {
  const rows = await restPost<DbUser>("users", {
    name: data.name,
    email: data.email,
    password_hash: data.passwordHash,
    role: data.role ?? "CITIZEN",
    mobile_number: data.mobileNumber ?? null,
    location: data.location ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!rows[0]) throw new Error("User creation failed — no row returned");
  return rows[0];
}

export async function markEmailVerified(userId: string): Promise<void> {
  await restPatch("users", { id: userId }, {
    email_verified: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await restPatch("users", { id: userId }, {
    password_hash: passwordHash,
    updated_at: new Date().toISOString(),
  });
}

// ============================================================
// Email verification token operations
// ============================================================

export async function createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await restPost("email_verification_tokens", {
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  });
}

export async function findEmailVerificationToken(token: string): Promise<DbEmailVerificationToken | null> {
  const rows = await restGet<DbEmailVerificationToken>("email_verification_tokens", { token: `eq.${token}` });
  return rows[0] ?? null;
}

export async function deleteEmailVerificationToken(token: string): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/email_verification_tokens`);
  url.searchParams.set("token", `eq.${token}`);
  await fetch(url.toString(), { method: "DELETE", headers: HEADERS });
}

// ============================================================
// Password reset token operations
// ============================================================

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await restPost("password_reset_tokens", {
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_at: new Date().toISOString(),
  });
}

export async function findPasswordResetToken(token: string): Promise<DbPasswordResetToken | null> {
  const rows = await restGet<DbPasswordResetToken>("password_reset_tokens", {
    token: `eq.${token}`,
    used: "eq.false",
  });
  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await restPatch("password_reset_tokens", { token }, { used: true });
}
