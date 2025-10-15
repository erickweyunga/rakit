import type { AxiosInstance } from "axios";

/** Default user type */
export interface User {
  id: string;
  email: string;
}

/** Session type (any extra info like tokens, roles, etc.) */
export type Session = Record<string, unknown>;

/** Middleware context passed to callbacks */
export interface MiddlewareContext<TUser = User, TSession = Session> {
  api: AxiosInstance;
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  user?: TUser | null;
  session?: TSession | null;
}

/** API client config */
export interface RakitConfig<TUser = User, TSession = Session> {
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
    onLogin?: <
      TResponse extends AuthResponse<
        TUser,
        TSession,
        Record<string, unknown>
      > = AuthResponse<TUser, TSession, Record<string, unknown>>,
    >(
      data: TResponse,
      ctx: MiddlewareContext<TUser, TSession>,
    ) => void | Promise<void>;

    onRegister?: <
      TResponse extends AuthResponse<
        TUser,
        TSession,
        Record<string, unknown>
      > = AuthResponse<TUser, TSession, Record<string, unknown>>,
    >(
      data: TResponse,
      ctx: MiddlewareContext<TUser, TSession>,
    ) => void | Promise<void>;

    onLogout?: (
      ctx: MiddlewareContext<TUser, TSession>,
    ) => void | Promise<void>;
    onRefresh?: (
      data: TSession & Record<string, unknown>,
      ctx: MiddlewareContext<TUser, TSession>,
    ) => void | Promise<void>;
    onMe?: <
      TResponse extends MeResponse<
        TUser,
        TSession,
        Record<string, unknown>
      > = MeResponse<TUser, TSession, Record<string, unknown>>,
    >(
      data: TResponse,
      ctx: MiddlewareContext<TUser, TSession>,
    ) => void | Promise<void>;
  };
}

/** Auth state */
export interface AuthState<TUser = User, TSession = Session> {
  user: TUser | null;
  session: TSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Login/Register credentials */
export type LoginCredentials = Record<string, unknown>;
export type RegisterCredentials = Record<string, unknown>;

/** Dynamic auth response */
export type AuthResponse<
  TUser = User,
  TSession = Session,
  TData extends Record<string, unknown> = Record<string, unknown>,
> = { user: TUser; session: TSession } & TData;

/** Me response */
export type MeResponse<
  TUser = User,
  TSession = Session,
  TData extends Record<string, unknown> = Record<string, unknown>,
> = { user: TUser; session: TSession } & TData;

/** Standard API error */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}
