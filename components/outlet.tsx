import React from "react";
import { Navigate, Outlet as ReactRouterDomOutlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import type { ProtectionStrategy } from "../types";

interface ProtectedOutletProps {
  redirectTo?: string;
  fallback?: React.ReactNode;
  strategy?: ProtectionStrategy;
  unauthenticatedRedirectTo?: string;
}

export function Outlet({
  redirectTo = "/login",
  fallback = null,
  strategy = "authenticated",
  unauthenticatedRedirectTo,
}: ProtectedOutletProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  const getRedirectPath = () => {
    switch (strategy) {
      case "unauthenticated":
      case "guest":
        return unauthenticatedRedirectTo || redirectTo || "/";
      case "authenticated":
      default:
        return redirectTo;
    }
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

  return <ReactRouterDomOutlet />;
}
