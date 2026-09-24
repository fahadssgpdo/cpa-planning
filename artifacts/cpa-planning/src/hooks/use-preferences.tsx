import { useContext, useState, useEffect, ReactNode } from "react";
import { UserContext } from "./user-context";
import { PreferencesContext, Preferences, Theme, FontSize } from "./preferences-context";

export type { Preferences, Theme, FontSize };

const DEFAULT: Preferences = {
  theme: "light",
  fontSize: "md",
  highContrast: false,
  reducedMotion: false,
};

function storageKey(userId: number | null) {
  return userId ? `hema_prefs_${userId}` : "hema_prefs_guest";
}

function load(userId: number | null): Preferences {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function applyPreferences(p: Preferences) {
  const root = document.documentElement;

  if (p.theme === "dark") {
    root.classList.add("dark");
  } else if (p.theme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  const fontSizes: Record<FontSize, string> = { sm: "93.75%", md: "100%", lg: "112.5%" };
  root.style.fontSize = fontSizes[p.fontSize];

  root.classList.toggle("high-contrast", p.highContrast);
  root.classList.toggle("reduce-motion", p.reducedMotion);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const userCtx = useContext(UserContext);
  const userId = userCtx?.user?.id ?? null;

  const [prefs, setPrefsState] = useState<Preferences>(() => load(userId));

  useEffect(() => {
    const loaded = load(userId);
    setPrefsState(loaded);
    applyPreferences(loaded);
  }, [userId]);

  useEffect(() => {
    applyPreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      document.documentElement.classList.toggle("dark", e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.theme]);

  function setPrefs(partial: Partial<Preferences>) {
    setPrefsState((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    });
  }

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
