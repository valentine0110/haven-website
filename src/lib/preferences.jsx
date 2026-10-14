import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const PREFS_KEY = "haven:preferences";

const DEFAULT_PREFS = {
  theme: "light", // "light" | "dark" | "system"
  areaUnit: "sqft", // "sqft" | "sqm"
  priceFormat: "inr_words", // "inr_words" (Cr/L) | "standard" (numeric)
};

const PreferencesContext = createContext({
  prefs: DEFAULT_PREFS,
  setTheme: () => {},
  toggleTheme: () => {},
  setAreaUnit: () => {},
  toggleAreaUnit: () => {},
  formatArea: (sqft) => `${sqft} sq ft`,
  isDark: false,
});

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return { ...DEFAULT_PREFS, theme: "dark" };
    }
    return DEFAULT_PREFS;
  });

  const isDark = useMemo(() => {
    if (prefs.theme === "system") {
      return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    }
    return prefs.theme === "dark";
  }, [prefs.theme]);

  // Apply theme attribute to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [isDark]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      // storage unavailable
    }
  }, [prefs]);

  const setTheme = (theme) => setPrefs((p) => ({ ...p, theme }));
  const toggleTheme = () => setPrefs((p) => ({ ...p, theme: isDark ? "light" : "dark" }));
  const setAreaUnit = (areaUnit) => setPrefs((p) => ({ ...p, areaUnit }));
  const toggleAreaUnit = () => setPrefs((p) => ({ ...p, areaUnit: p.areaUnit === "sqft" ? "sqm" : "sqft" }));

  const formatArea = (sqft) => {
    const num = Number(sqft) || 0;
    if (prefs.areaUnit === "sqm") {
      const sqm = Math.round(num * 0.092903);
      return `${sqm.toLocaleString("en-IN")} sq m`;
    }
    return `${num.toLocaleString("en-IN")} sq ft`;
  };

  const value = {
    prefs,
    isDark,
    setTheme,
    toggleTheme,
    setAreaUnit,
    toggleAreaUnit,
    formatArea,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

