import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ApiClient from "../core/api-client";
import type { RakitConfig, AuthState, Credentials } from "../types";
import TokenManager from "../core/token-manager";

export interface AuthContextValue<
  TResponse extends Record<string, any> = Record<string, any>,
> extends AuthState<TResponse> {
  login: (credentials: Credentials) => Promise<TResponse>;
  register: (credentials: Credentials) => Promise<TResponse>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps<
  TResponse extends Record<string, any> = Record<string, any>,
> {
  config: RakitConfig<TResponse>;
  children: React.ReactNode;
}

export function AuthProvider<
  TResponse extends Record<string, any> = Record<string, any>,
>({ config, children }: AuthProviderProps<TResponse>): React.ReactElement {
  const [state, setState] = useState<AuthState<TResponse>>(() => {
    const tokenManager = new TokenManager(
      config.tokenKey,
      config.refreshTokenKey,
    );

    const hasValidToken = tokenManager.isAuthenticated();
    const hasRefreshToken = !!tokenManager.getRefreshToken();

    const isAuthenticated = hasValidToken || hasRefreshToken;

    return {
      data: null,
      isAuthenticated,
      isLoading: true,
    } as AuthState<TResponse>;
  });

  const apiClientRef = useRef<ApiClient<TResponse> | null>(null);

  useEffect(() => {
    apiClientRef.current = new ApiClient<TResponse>({
      ...config,
      onRefreshFailed: () =>
        setState({
          data: null,
          isAuthenticated: false,
          isLoading: false,
        } as AuthState<TResponse>),
    });
  }, [config]);

  const fetch = useCallback(async () => {
    if (!apiClientRef.current) return;

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await apiClientRef.current.me();
      setState({ data, isAuthenticated: true, isLoading: false });
    } catch {
      setState({ data: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const login = useCallback(async (credentials: Credentials) => {
    if (!apiClientRef.current) throw new Error("ApiClient not initialized");
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await apiClientRef.current.login(credentials);
      setState({ data, isAuthenticated: true, isLoading: false });
      return data;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (credentials: Credentials) => {
    if (!apiClientRef.current) throw new Error("ApiClient not initialized");
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await apiClientRef.current.register(credentials);
      setState({ data, isAuthenticated: true, isLoading: false });
      return data;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    if (!apiClientRef.current) throw new Error("ApiClient not initialized");
    try {
      await apiClientRef.current.logout();
    } finally {
      setState({ data: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const refetch = useCallback(async () => fetch(), [fetch]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
