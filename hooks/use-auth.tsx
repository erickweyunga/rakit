import { useContext } from "react";
import { AuthContext } from "../components/auth-provider";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from "../types";

interface AuthContextValue<T = Record<string, unknown>> extends AuthState<T> {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials<T>) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export function useAuth<T = Record<string, unknown>>(): AuthContextValue<T> {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context as AuthContextValue<T>;
}
