import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ApiClient from "../utils/api-client";
import type {
  RakitConfig,
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  MiddlewareContext,
  RefreshResponse,
  MeResponse,
} from "../types";

interface AuthContextValue<TUser extends User = User> extends AuthState<TUser> {
  login: (credentials: LoginCredentials) => Promise<AuthResponse<TUser>>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse<TUser>>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue<User> | null>(null);
export { AuthContext };

interface AuthProviderProps<TUser extends User = User> {
  config: RakitConfig<TUser>;
  children: React.ReactNode;
}

export function AuthProvider<TUser extends User = User>({
  config,
  children,
}: AuthProviderProps<TUser>): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState<TUser>>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const apiClientRef = useRef<ApiClient<TUser> | null>(null);

  useEffect(() => {
    apiClientRef.current = new ApiClient<TUser>({
      ...config,
      middleware: config.middleware as unknown as {
        onLogin?: (
          data: AuthResponse<User>,
          ctx: MiddlewareContext<User>,
        ) => void | Promise<void>;
        onRegister?: (
          data: AuthResponse<User>,
          ctx: MiddlewareContext<User>,
        ) => void | Promise<void>;
        onLogout?: (ctx: MiddlewareContext<User>) => void | Promise<void>;
        onRefresh?: (
          data: RefreshResponse,
          ctx: MiddlewareContext<User>,
        ) => void | Promise<void>;
        onMe?: (
          data: MeResponse<User>,
          ctx: MiddlewareContext<User>,
        ) => void | Promise<void>;
      },
      onRefreshFailed: () =>
        setAuthState({ user: null, isAuthenticated: false, isLoading: false }),
    });
  }, [config]);

  const fetchUser = useCallback(async () => {
    if (!apiClientRef.current) return;

    const tokenManager = apiClientRef.current.getTokenManager();
    const token = tokenManager.getToken();

    if (!token || tokenManager.isTokenExpired(token)) {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await apiClientRef.current.getCurrentUser();
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!apiClientRef.current) throw new Error("API client not initialized");

    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await apiClientRef.current.login(credentials);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response;
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    if (!apiClientRef.current) throw new Error("API client not initialized");

    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await apiClientRef.current.register(credentials);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response;
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    if (!apiClientRef.current) throw new Error("API client not initialized");

    try {
      await apiClientRef.current.logout();
    } finally {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const refetchUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ ...authState, login, register, logout, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
