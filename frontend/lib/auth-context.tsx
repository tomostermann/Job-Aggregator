"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import { decodeJwt, isJwtExpired } from "./jwt";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const STORAGE_KEY = "jobaggregator.token";
const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string): AuthUser | null {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return {
    id: decoded.id,
    email: decoded.email ?? "",
    role: decoded.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && !isJwtExpired(stored)) {
      setToken(stored);
      setUser(userFromToken(stored));
    } else if (stored) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((t: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, t);
    }
    setToken(t);
    setUser(userFromToken(t));
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const { token: t } = await api.login(email, password);
      persist(t);
      const u = userFromToken(t);
      if (!u) throw new Error("Invalid token returned by server");
      return { ...u, email };
    },
    [persist],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async (email, password) => {
      const { token: t } = await api.register(email, password);
      persist(t);
      const u = userFromToken(t);
      if (!u) throw new Error("Invalid token returned by server");
      return { ...u, email };
    },
    [persist],
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
