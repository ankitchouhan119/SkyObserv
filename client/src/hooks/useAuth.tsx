"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  email: string;
  fullName?: string;
  contactNumber?: string | null;
  organisation?: string | null;
  apiToken: string;
  isAdmin: boolean;
  isInvitedMember?: boolean;
  canManageTeam?: boolean;
};

export type SignupPayload = {
  email: string;
  fullName: string;
  contactNumber: string;
  organisation: string;
  password: string;
  confirmPassword: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  authEnabled: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (payload: SignupPayload) => Promise<string | null>;
  forgotPassword: (email: string) => Promise<string | null>;
  resetPassword: (email: string, otp: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setAuthEnabled(Boolean(data.authEnabled));
      setUser(data.user ?? null);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setAuthEnabled(Boolean(data.authEnabled));
    setUser(null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message || "Login failed";
    }

    const data = await res.json();
    setAuthEnabled(true);
    setUser(data.user);
    return null;
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message || "Signup failed";
    }

    const data = await res.json();
    setAuthEnabled(true);
    setUser(data.user);
    return null;
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.message || "Could not send reset code";
    return null;
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, password: string) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.message || "Could not reset password";
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, authEnabled, loading, login, signup, forgotPassword, resetPassword, logout, refresh }),
    [user, authEnabled, loading, login, signup, forgotPassword, resetPassword, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
