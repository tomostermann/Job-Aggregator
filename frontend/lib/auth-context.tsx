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

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  signature?: string;
}

interface CvUpload {
  filename: string;
  mimetype: string;
  data: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  updateProfile: (input: ProfileUpdate) => Promise<AuthUser>;
  uploadCv: (cv: CvUpload) => Promise<AuthUser>;
  deleteCv: () => Promise<AuthUser>;
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
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    phone: decoded.phone,
    signature: decoded.signature,
    hasCv: decoded.hasCv,
    cvFilename: decoded.cvFilename,
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
      return u;
    },
    [persist],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async ({ email, password, firstName, lastName }) => {
      const { token: t } = await api.register({
        email,
        password,
        firstName,
        lastName,
      });
      persist(t);
      const u = userFromToken(t);
      if (!u) throw new Error("Invalid token returned by server");
      return u;
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

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (input) => {
      if (!token) throw new Error("Non authentifié");
      const { token: t } = await api.updateMe(token, input);
      persist(t);
      const u = userFromToken(t);
      if (!u) throw new Error("Token invalide retourné par le serveur");
      return u;
    },
    [token, persist],
  );

  const uploadCv = useCallback<AuthContextValue["uploadCv"]>(
    async (cv) => {
      if (!token) throw new Error("Non authentifié");
      const { token: t } = await api.uploadCv(token, cv);
      persist(t);
      const u = userFromToken(t);
      if (!u) throw new Error("Token invalide retourné par le serveur");
      return u;
    },
    [token, persist],
  );

  const deleteCv = useCallback<AuthContextValue["deleteCv"]>(async () => {
    if (!token) throw new Error("Non authentifié");
    const { token: t } = await api.deleteCv(token);
    persist(t);
    const u = userFromToken(t);
    if (!u) throw new Error("Token invalide retourné par le serveur");
    return u;
  }, [token, persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      uploadCv,
      deleteCv,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      uploadCv,
      deleteCv,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
