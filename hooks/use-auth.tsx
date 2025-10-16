import { useContext } from "react";
import { AuthContext } from "../components/auth-provider";
import type { Credentials, AuthState } from "../types";

export interface AuthContextValue<
  TResponse extends Record<string, any> = Record<string, any>,
> extends AuthState<TResponse> {
  login: (credentials: Credentials) => Promise<TResponse>;
  register: (credentials: Credentials) => Promise<TResponse>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to access auth state and actions
 */
export function useAuth<
  TResponse extends Record<string, any> = Record<string, any>,
>(): AuthContextValue<TResponse> {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context as AuthContextValue<TResponse>;
}
