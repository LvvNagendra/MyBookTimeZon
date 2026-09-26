import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  apiMe,
  clearDummyProfile,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  type ProfileData,
} from "../api/client";

type AuthContextValue = {
  token: string | null;
  profile: ProfileData | null;
  loading: boolean;
  signIn: (accessToken: string) => void;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  const refreshProfile = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await apiMe(t));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    void apiMe(token)
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch(() => {
        if (alive) setProfile(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const signIn = useCallback((accessToken: string) => {
    setStoredToken(accessToken);
    setToken(accessToken);
  }, []);

  const signOut = useCallback(() => {
    clearStoredToken();
    clearDummyProfile();
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ token, profile, loading, signIn, signOut, refreshProfile }),
    [token, profile, loading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
