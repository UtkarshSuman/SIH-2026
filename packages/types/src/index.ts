/**
 * FEATURE: Shared TypeScript contracts used across the monorepo (currently
 * just consumed by frontend/, will also be mirrored as Pydantic models in
 * backend/ once Phase 3 adds it).
 * INSTALLATION: none - plain TypeScript, no extra packages.
 */

export type UserRole = "CITIZEN" | "ADMIN" | "DEPARTMENT_OFFICIAL" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export type AuthMode = "login" | "register";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;