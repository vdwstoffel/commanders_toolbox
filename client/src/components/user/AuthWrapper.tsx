/**
 * Wrapper that gates protected routes. Redirects to /login when unauthenticated.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "./useUser";

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
