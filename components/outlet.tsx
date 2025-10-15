import React from "react";
import { Navigate, Outlet as ReactRouterDomOutlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

interface ProtectedOutletProps {
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * ProtectedOutlet works like a wrapper for nested routes.
 * It will render the <Outlet /> if authenticated,
 * otherwise it redirects to `redirectTo`.
 */
export function Outlet({
  redirectTo = "/login",
  fallback = null,
}: ProtectedOutletProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <ReactRouterDomOutlet />;
}
