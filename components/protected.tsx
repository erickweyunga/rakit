import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import type { ProtectionStrategy } from "../types";

interface ProtectedProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  strategy?: ProtectionStrategy;
  /**
   * Custom redirect for unauthenticated/guest strategies
   * Defaults to redirectTo when not specified
   */
  unauthenticatedRedirectTo?: string;
}

export function Protected({
  children,
  redirectTo = "/login",
  fallback = null,
  strategy = "authenticated",
  unauthenticatedRedirectTo,
}: ProtectedProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  const getRedirectPath = () => {
    if (strategy === "unauthenticated" || strategy === "guest") {
      return unauthenticatedRedirectTo || redirectTo || "/";
    }
    return redirectTo;
  };

  switch (strategy) {
    case "authenticated":
      if (!isAuthenticated) {
        return <Navigate to={getRedirectPath()} replace />;
      }
      break;

    case "unauthenticated":
    case "guest":
      if (isAuthenticated) {
        return <Navigate to={getRedirectPath()} replace />;
      }
      break;

    case "public":
      break;
  }

  return <>{children}</>;
}
