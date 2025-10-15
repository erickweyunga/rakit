import { useContext } from "react";
import { AuthContext } from "../components/auth-provider";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "../types";

export interface AuthContextValue<TUser = User> extends AuthState<TUser> {
  login: (credentials: LoginCredentials) => Promise<AuthResponse<TUser>>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse<TUser>>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export function useAuth<TUser = User>(): AuthContextValue<TUser> {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context as AuthContextValue<TUser>;
}
