import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "../api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("adminToken"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          const u = res.data.data;
          const adminRoles = ["admin", "manager", "owner"];
          if (!adminRoles.includes(u.role)) {
            setToken(null);
            setUser(null);
            localStorage.removeItem("adminToken");
          } else {
            setUser(u);
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem("adminToken");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user: u } = res.data.data;
    const adminRoles = ["admin", "manager", "owner"];
    if (!adminRoles.includes(u.role)) {
      throw new Error("Access denied. Admin, manager or owner account required.");
    }
    localStorage.setItem("adminToken", accessToken);
    setToken(accessToken);
    setUser(u);
  };

  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("adminToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
