/**
 * Global state to keep the user idToken and user details
 *
 */

import { useAuth0 } from "@auth0/auth0-react";
import { createContext, useEffect, useState, type ReactNode } from "react";

interface UserContextInterface {
  idToken: string;
  isAuthenticated: boolean
}

interface UserTokenProviderProps {
  children: ReactNode;
}

export const UserContext = createContext<UserContextInterface>({ idToken: "", isAuthenticated: false });

export default function UserContextProvider({ children }: UserTokenProviderProps) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [idToken, setIdToken] = useState<string>("");

  useEffect(() => {
    async function getToken() {
      const token = await getAccessTokenSilently({ detailedResponse: true });
      setIdToken(token.id_token);
    }

    getToken();
  }, [getAccessTokenSilently]);

  return <UserContext.Provider value={{ idToken, isAuthenticated }}>{children}</UserContext.Provider>;
}
