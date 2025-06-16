/**
 * Wrapper component the checks if the user is logged in, if not return the to page to ask for login
 */

import type { ReactNode } from "react";
import { useUser } from "./useUser";
import ErrorMessage from "../ui/ErrorMessage";

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <ErrorMessage msg="Login or create account to view this page" />;
  }

  return <>{children}</>;
}
