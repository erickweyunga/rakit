import type { AxiosInstance } from "axios";

/** Default user type */
export interface User {
  id: string;
  email: string;
}

/** Generic session data (tokens, roles, etc.) */
export type Session = Record<string, unknown>;

/** Decoded token interface */
export interface DecodedToken {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Context passed to callbacks */
export interface MiddlewareContext {
  api: AxiosInstance;

  // Access token methods
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;

  // Refresh token methods
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;

  // Combined token methods
  clearTokens: () => void;

  // Auth actions
  login: (credentials: Record<string, any>) => Promise<any>;
  logout: () => Promise<void>;
  refresh: () => Promise<any>;
  me: () => Promise<any>;
}

/** API client configuration */
export interface RakitConfig<
  TResponse extends Record<string, any> = Record<string, any>,
> {
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

  /** Callback hooks for auth lifecycle */
  callbacks?: {
    /** Called after successful login */
    login?: (data: TResponse, ctx: MiddlewareContext) => void | Promise<void>;

    /** Called after successful registration */
    register?: (
      data: TResponse,
      ctx: MiddlewareContext,
    ) => void | Promise<void>;

    /** Called on logout */
    logout?: (ctx: MiddlewareContext) => void | Promise<void>;

    /** Called when token is refreshed */
    refresh?: (data: TResponse, ctx: MiddlewareContext) => void | Promise<void>;

    /** Called after fetching /me */
    me?: (data: TResponse, ctx: MiddlewareContext) => void | Promise<void>;
  };

  /** Called when refresh token fails */
  onRefreshFailed?: () => void;
}

/** Authentication state */
export interface AuthState<
  TResponse extends Record<string, any> = Record<string, any>,
> {
  data: TResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Credentials for login/register */
export type Credentials = Record<string, unknown>;

/** Standard API error */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/** Token response structure */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user?: any;
}
