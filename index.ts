import { AuthProvider } from "./components/auth-provider";
import { Protected } from "./components/protected";
import { Outlet } from "./components/outlet";
import type { User } from "./types";

export const Rakit = {
  Provider: AuthProvider as <TUser extends User = User>(
    props: React.ComponentProps<typeof AuthProvider<TUser>>,
  ) => React.ReactElement,
  Protected: Protected,
  Outlet: Outlet,
};

export { AuthProvider } from "./components/auth-provider";
export { Protected } from "./components/protected";
export { Outlet } from "./components/outlet";
export { useAuth } from "./hooks/use-auth";

export type {
  RakitConfig,
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshResponse,
  MeResponse,
  ApiError,
} from "./types";
