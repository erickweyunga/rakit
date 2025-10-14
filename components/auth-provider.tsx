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
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "../types";

interface AuthContextValue<T = Record<string, unknown>> extends AuthState<T> {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials<T>) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

interface AuthProviderProps {
  config: RakitConfig;
  children: React.ReactNode;
}

export function AuthProvider<T = Record<string, unknown>>({
  config,
  children,
}: AuthProviderProps): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState<T>>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const apiClientRef = useRef<ApiClient<T>>(null);

  useEffect(() => {
    apiClientRef.current = new ApiClient<T>({
      baseURL: config.baseURL,
      tokenKey: config.tokenKey,
      refreshTokenKey: config.refreshTokenKey,
      endpoints: config.endpoints,
      onRefreshFailed: () => {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    });
  }, [config]);

  const fetchUser = useCallback(async () => {
    if (!apiClientRef.current) return;

    try {
      const tokenManager = apiClientRef.current.getTokenManager();
      const token = tokenManager.getToken();

      if (!token || tokenManager.isTokenExpired(token)) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const response = await apiClientRef.current.getCurrentUser();
      setAuthState({
        user: response.user as AuthUser<T>,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!apiClientRef.current) {
      throw new Error("API client not initialized");
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response = await apiClientRef.current.login(credentials);

      setAuthState({
        user: response.user as AuthUser<T>,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials<T>) => {
    if (!apiClientRef.current) {
      throw new Error("API client not initialized");
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response = await apiClientRef.current.register(credentials);

      setAuthState({
        user: response.user as AuthUser<T>,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!apiClientRef.current) {
      throw new Error("API client not initialized");
    }

    try {
      await apiClientRef.current.logout();
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const refetchUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextValue<T> = {
    ...authState,
    login,
    register,
    logout,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value as AuthContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
