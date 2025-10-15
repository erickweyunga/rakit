import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ApiClient from "../core/api-client";
import type {
  RakitConfig,
  AuthState,
  User,
  Session,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  MeResponse,
} from "../types";

// --- Auth Context Value ---
export interface AuthContextValue<
  TUser extends User = User,
  TSession extends Session = Session,
> extends AuthState<TUser, TSession> {
  login: (
    credentials: LoginCredentials,
  ) => Promise<AuthResponse<TUser, TSession>>;
  register: (
    credentials: RegisterCredentials,
  ) => Promise<AuthResponse<TUser, TSession>>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

// --- Context ---
export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps<
  TUser extends User = User,
  TSession extends Session = Session,
> {
  config: RakitConfig<TUser, TSession>;
  children: React.ReactNode;
}

// --- AuthProvider Component ---
export function AuthProvider<
  TUser extends User = User,
  TSession extends Session = Session,
>({
  config,
  children,
}: AuthProviderProps<TUser, TSession>): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState<TUser, TSession>>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const apiClientRef = useRef<ApiClient<TUser, TSession> | null>(null);

  // Initialize ApiClient
  useEffect(() => {
    apiClientRef.current = new ApiClient<TUser, TSession>({
      ...config,
      onRefreshFailed: () =>
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    });
  }, [config]);

  // Fetch current user + session
  const fetchUser = useCallback(async () => {
    if (!apiClientRef.current) return;

    const tokenManager = apiClientRef.current.getTokenManager();
    const token = tokenManager.getToken();

    if (!token || tokenManager.isTokenExpired(token)) {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const response =
        await apiClientRef.current.getCurrentUser<
          MeResponse<TUser, TSession>
        >();
      setAuthState({
        user: response.user,
        session: response.session,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // --- Login ---
  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<AuthResponse<TUser, TSession>> => {
      if (!apiClientRef.current) throw new Error("API client not initialized");

      setAuthState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response =
          await apiClientRef.current.login<AuthResponse<TUser, TSession>>(
            credentials,
          );
        setAuthState({
          user: response.user,
          session: response.session,
          isAuthenticated: true,
          isLoading: false,
        });
        return response;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  // --- Register ---
  const register = useCallback(
    async (
      credentials: RegisterCredentials,
    ): Promise<AuthResponse<TUser, TSession>> => {
      if (!apiClientRef.current) throw new Error("API client not initialized");

      setAuthState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response =
          await apiClientRef.current.register<AuthResponse<TUser, TSession>>(
            credentials,
          );
        setAuthState({
          user: response.user,
          session: response.session,
          isAuthenticated: true,
          isLoading: false,
        });
        return response;
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  // --- Logout ---
  const logout = useCallback(async () => {
    if (!apiClientRef.current) throw new Error("API client not initialized");
    try {
      await apiClientRef.current.logout();
    } finally {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // --- Refetch user/session ---
  const refetchUser = useCallback(async () => fetchUser(), [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ ...authState, login, register, logout, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
