"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: string, params: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function ConvexAuthProvider({ children }: { children: ReactNode; client?: unknown }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((body: { isAuthenticated?: boolean }) => {
        if (!cancelled) setAuthenticated(Boolean(body.isAuthenticated));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated,
      isLoading,
      signIn: async (_provider, params) => {
        const response = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(params),
        });
        const body = (await response.json()) as { errorMessage?: string };
        if (!response.ok) throw new Error(body.errorMessage || "Sign-in failed.");
        setAuthenticated(true);
      },
      signOut: async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        setAuthenticated(false);
      },
    }),
    [isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useConvexAuth() {
  const value = useContext(AuthContext);
  if (!value) return { isAuthenticated: false, isLoading: false };
  return { isAuthenticated: value.isAuthenticated, isLoading: value.isLoading };
}

export function useAuthActions() {
  const value = useContext(AuthContext);
  if (!value) {
    return {
      signIn: async () => {
        throw new Error("Auth provider is missing.");
      },
      signOut: async () => undefined,
    };
  }
  return { signIn: value.signIn, signOut: value.signOut };
}
