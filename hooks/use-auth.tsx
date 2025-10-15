import { useContext } from "react";
import { AuthContext } from "../components/auth-provider";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
  Session,
} from "../types";

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

export function useAuth<
  TUser extends User = User,
  TSession extends Session = Session,
>(): AuthContextValue<TUser, TSession> {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context as AuthContextValue<TUser, TSession>;
}
