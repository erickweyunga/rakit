import React from "react";
import { AuthProvider } from "./components/auth-provider";
import { Protected } from "./components/protected";
import { Outlet } from "./components/outlet";
import { useAuth } from "./hooks/use-auth";

/**
 * Rakit main export — lightweight authentication toolkit
 */
export const Rakit = {
  Provider: AuthProvider as <
    TResponse extends Record<string, any> = Record<string, any>,
  >(
    props: React.ComponentProps<typeof AuthProvider<TResponse>>,
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
  AuthState,
  Credentials,
  User,
  Session,
  ApiError,
  MiddlewareContext,
} from "./types";

/* -----------------------------
 * Core Utilities
 * ---------------------------- */
export { default as ApiClient } from "./core/api-client";
export { default as TokenManager } from "./core/token-manager";
