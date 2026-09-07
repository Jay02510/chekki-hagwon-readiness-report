"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ko";
export type Localized = { en: string; ko: string };

export function pick(loc: Localized, lang: Lang): string {
  return loc[lang];
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("hagwon-readiness-lang");
    if (stored === "en" || stored === "ko") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("hagwon-readiness-lang", l);
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
