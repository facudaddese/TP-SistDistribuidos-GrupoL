/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { LoginRequest, Rol } from "../types/Auth";
import { authApi } from "../api/auth";

export interface AuthUser {
  id: number;
  email: string;
  rol: Rol;
  nombreCompleto: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  rol: Rol | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user_data";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthUser> => {
    const response = await authApi.login(credentials);
    const authUser: AuthUser = {
      id: response.id,
      email: response.email,
      rol: response.rol,
      nombreCompleto: response.nombreCompleto,
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));

    setToken(response.token);
    setUser(authUser);

    return authUser;
  };

  useEffect(() => {
    const syncUser = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && !user) {
        try {
          const profile = await authApi.getUsuarioActual();
          const authUser: AuthUser = {
            id: profile.id,
            email: profile.email,
            rol: profile.rol,
            nombreCompleto: profile.nombreCompleto,
          };
          setUser(authUser);
          localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    syncUser();
  }, [user, logout]);

  const value: AuthContextValue = {
    user,
    token,
    rol: user?.rol ?? null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};
