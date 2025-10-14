export interface AuthUser<T = Record<string, unknown>> {
  id: string;
  email: string;
  metadata?: T;
}

export interface RakitConfig {
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
}

export interface AuthState<T = Record<string, unknown>> {
  user: AuthUser<T> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials<T = Record<string, unknown>> {
  email: string;
  password: string;
  metadata?: T;
}

export interface AuthResponse<T = Record<string, unknown>> {
  user: AuthUser<T>;
  accessToken?: string;
}

export interface RefreshResponse {
  accessToken?: string;
}

export interface MeResponse<T = Record<string, unknown>> {
  user: AuthUser<T>;
}
