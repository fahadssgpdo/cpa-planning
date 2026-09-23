import { createContext } from "react";

export type Theme = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";

export interface Preferences {
  theme: Theme;
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface PreferencesContextType {
  prefs: Preferences;
  setPrefs: (p: Partial<Preferences>) => void;
}

export const PreferencesContext = createContext<PreferencesContextType | null>(null);
