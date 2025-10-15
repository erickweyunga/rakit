import React from "react";
import { AuthProvider } from "./components/auth-provider";
import { Protected } from "./components/protected";
import { Outlet } from "./components/outlet";
import { useAuth } from "./hooks/use-auth";

import type { User, Session } from "./types";

/**
 * Rakit main export — lightweight authentication toolkit
 */
export const Rakit = {
  Provider: AuthProvider as <
    TUser extends User = User,
    TSession extends Session = Session,
  >(
    props: React.ComponentProps<typeof AuthProvider<TUser, TSession>>,
  ) => React.ReactElement,
  Protected,
  Outlet,
  useAuth,
};

/* -----------------------------
 * Named Exports for Direct Import
 * ---------------------------- */
export { AuthProvider } from "./components/auth-provider";
export { Protected } from "./components/protected";
export { Outlet } from "./components/outlet";
export { useAuth } from "./hooks/use-auth";

/* -----------------------------
 * Type Exports
 * ---------------------------- */
export type {
  RakitConfig,
  User,
  Session,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  MeResponse,
  ApiError,
  MiddlewareContext,
} from "./types";

/* -----------------------------
 * Core Utilities
 * ---------------------------- */
export { default as ApiClient } from "./core/api-client";
export { default as TokenManager } from "./core/token-manager";
