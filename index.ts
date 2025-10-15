import { AuthProvider } from "./components/auth-provider";
import { Protected } from "./components/protected";
import { Outlet } from "./components/outlet";

export const Rakit = {
  Provider: AuthProvider,
  Protected: Protected,
  Outlet: Outlet,
};

export { AuthProvider } from "./components/auth-provider";
export { Protected } from "./components/protected";
export { Outlet } from "./components/outlet";
export { useAuth } from "./hooks/use-auth";

export type {
  RakitConfig,
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshResponse,
  MeResponse,
} from "./types";
