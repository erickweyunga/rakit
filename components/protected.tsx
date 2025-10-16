import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

interface ProtectedProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function Protected({
  children,
  redirectTo = "/login",
  fallback = null,
}: ProtectedProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
