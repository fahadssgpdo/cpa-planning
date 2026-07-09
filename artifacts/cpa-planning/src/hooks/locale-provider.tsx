import { createContext, useState, useEffect, ReactNode } from "react";
import { translations, Lang, Translations } from "@/i18n";

export interface LocaleContextType {
  lang: Lang;
  locale: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

export const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("cpa_lang") as Lang) || "ar";
    } catch {
      return "ar";
    }
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("cpa_lang", newLang);
    } catch {}
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = translations[lang] as unknown as Translations;

  return (
    <LocaleContext.Provider value={{ lang, locale: lang, setLang, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}
