import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRAND_STORAGE, readStorageKey } from "../components/BrandLogo";

type Mode = "light" | "dark";

type ThemeContextValue = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDom(mode: Mode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    const s = readStorageKey(BRAND_STORAGE.theme, BRAND_STORAGE.legacyTheme) as Mode | null;
    if (s === "dark" || s === "light") return s;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyDom(mode);
    localStorage.setItem(BRAND_STORAGE.theme, mode);
  }, [mode]);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === "light" ? "dark" : "light")), []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
