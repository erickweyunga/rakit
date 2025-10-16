import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ApiClient from "../core/api-client";
import type { RakitConfig, AuthState, Credentials } from "../types";

export interface AuthContextValue<
  TResponse extends Record<string, any> = Record<string, any>,
> extends AuthState<TResponse> {
  login: (credentials: Credentials) => Promise<TResponse>;
  register: (credentials: Credentials) => Promise<TResponse>;
  logout: () => Promise<void>;
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
  const [state, setState] = useState<AuthState<TResponse>>({
    data: null,
    isAuthenticated: false,
    isLoading: true,
  } as AuthState<TResponse>);

  const apiClientRef = useRef<ApiClient<TResponse> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        const apiClient = new ApiClient<TResponse>({
          ...config,
          onRefreshFailed: () => {
            if (mountedRef.current) {
              setState({
                data: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          },
        });

        apiClientRef.current = apiClient;

        const tokenManager = apiClient.getTokenManager();
        const hasValidToken = tokenManager.isAuthenticated();
        const hasRefreshToken = !!tokenManager.getRefreshToken();

        if (!hasValidToken && !hasRefreshToken) {
          if (mountedRef.current) {
            setState({
              data: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
          return;
        }

        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isLoading: true }));
        }

        const userData = await apiClient.me();

        if (mountedRef.current) {
          setState({
            data: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch (error) {
        if (mountedRef.current) {
          setState({
            data: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    initAuth();

    return () => {
      mountedRef.current = false;
    };
  }, [config]);

  const executeAuthAction = useCallback(
    async <T,>(
      action: () => Promise<T>,
      successCallback?: (data: T) => void,
    ): Promise<T> => {
      if (!apiClientRef.current) {
        throw new Error("ApiClient not initialized");
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: true }));
      }

      try {
        const result = await action();

        if (mountedRef.current) {
          successCallback?.(result);
        }

        return result;
      } catch (error) {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
        throw error;
      }
    },
    [],
  );

  const login = useCallback(
    async (credentials: Credentials) => {
      return executeAuthAction(
        async () => {
          await apiClientRef.current!.login(credentials);

          try {
            const userData = await apiClientRef.current!.me();
            return userData;
          } catch (error) {
            throw new Error("Error during authentication");
          }
        },
        (userData) => {
          setState({
            data: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        },
      );
    },
    [executeAuthAction],
  );

  const register = useCallback(async (credentials: Credentials) => {
    if (!apiClientRef.current) {
      throw new Error("ApiClient not initialized");
    }
    const data = await apiClientRef.current.register(credentials);
    return data;
  }, []);

  const logout = useCallback(async () => {
    return executeAuthAction(
      async () => {
        await apiClientRef.current!.logout();
      },
      () => {
        setState({
          data: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    );
  }, [executeAuthAction]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
