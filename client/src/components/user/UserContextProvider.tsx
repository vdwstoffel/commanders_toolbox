/**
 * Global state to keep the user's JWT and expose auth actions (local auth).
 */

import { createContext, useEffect, useState, type ReactNode } from "react";
import { AuthApi } from "@/api/authApi";

interface UserContextInterface {
  idToken: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface UserTokenProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "idToken";
const authApi = new AuthApi();

export function isTokenValid(token: string): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const UserContext = createContext<UserContextInterface>({
  idToken: "",
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export default function UserContextProvider({ children }: UserTokenProviderProps) {
  const [idToken, setIdToken] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenValid(stored)) {
      setIdToken(stored);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  async function login(email: string, password: string) {
    const token = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setIdToken(token);
  }

  async function register(email: string, password: string) {
    const token = await authApi.register(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setIdToken(token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setIdToken("");
  }

  const isAuthenticated = isTokenValid(idToken);

  return (
    <UserContext.Provider value={{ idToken, isAuthenticated, login, register, logout }}>{children}</UserContext.Provider>
  );
}
