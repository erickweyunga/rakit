import type { AxiosInstance } from "axios";

/**
 * Default user type
 */
export interface User {
  id: string;
  email: string;
}

/**
 * Middleware context passed to all middleware callbacks
 */
export interface MiddlewareContext<TUser = User> {
  api: AxiosInstance; // Axios instance for additional API calls
  getToken: () => string | null; // Get current access token
  setToken: (token: string) => void; // Set new access token
  removeToken: () => void; // Clear token
  user?: TUser | null; // Optional user object
}

/**
 * Configuration for the API client
 */
export interface RakitConfig<TUser = User> {
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    me: string;
  };
  tokenKey?: string;
  refreshTokenKey?: string;
  baseURL?: string;
  middleware?: {
    onLogin?: (
      data: AuthResponse<TUser>,
      ctx: MiddlewareContext<TUser>,
    ) => void | Promise<void>;
    onRegister?: (
      data: AuthResponse<TUser>,
      ctx: MiddlewareContext<TUser>,
    ) => void | Promise<void>;
    onLogout?: (ctx: MiddlewareContext<TUser>) => void | Promise<void>;
    onRefresh?: (
      data: RefreshResponse,
      ctx: MiddlewareContext<TUser>,
    ) => void | Promise<void>;
    onMe?: (
      data: MeResponse<TUser>,
      ctx: MiddlewareContext<TUser>,
    ) => void | Promise<void>;
  };
}

/**
 * Auth state representation
 */
export interface AuthState<TUser = User> {
  user: TUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Credentials for login and register
 */
export type LoginCredentials = Record<string, unknown>;
export type RegisterCredentials = Record<string, unknown>;

/**
 * Standard response types
 */
export type AuthResponse<TUser = User> = {
  user: TUser;
} & Record<string, unknown>;

export type RefreshResponse = Record<string, unknown>;

export type MeResponse<TUser = User> = {
  user: TUser;
} & Record<string, unknown>;

/**
 * Standard API error type
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}
