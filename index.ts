import { AuthProvider } from "./components/auth-provider";
import { Protected } from "./components/protected";

export const Rakit = {
  Provider: AuthProvider,
  Protected: Protected,
};

export { AuthProvider } from "./components/auth-provider";
export { Protected } from "./components/protected";
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
