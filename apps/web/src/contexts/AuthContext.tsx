"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import type { User } from "@fin-tracker/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (token) {
      // Token exists, set API client token
      apiClient.setToken(token);
      // In a real app, you'd fetch the user profile here
      // For now, we'll just mark as not loading
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
      }>("/auth/login", { email, password });

      console.log(response);

      const { user, tokens } = response;

      apiClient.setToken(tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setUser(user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        tokens: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
      }>("/auth/register", { email, password, name });

      const { user, tokens } = response;

      apiClient.setToken(tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setUser(user);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
