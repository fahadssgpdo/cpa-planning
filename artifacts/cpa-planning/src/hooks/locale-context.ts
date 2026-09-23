import { createContext } from "react";
import { Lang, Translations } from "@/i18n";

export interface LocaleContextType {
  lang: Lang;
  locale: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

export const LocaleContext = createContext<LocaleContextType | null>(null);
