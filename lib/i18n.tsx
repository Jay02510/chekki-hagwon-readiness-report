"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ko";
export type Localized = { en: string; ko: string };

const KEY = "hagwon-readiness-lang";
const isLang = (v: unknown): v is Lang => v === "en" || v === "ko";

export function pick(loc: Localized, lang: Lang): string {
  return loc[lang];
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // ?lang= (e.g. from a Korean link on chekkiai.com/schools) wins, then a
  // saved choice, then the browser language — most visitors are Korean.
  // ponytail: server render is still English, so Korean visitors see a brief
  // English flash; per-language routes (/ko) fix that if it matters.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    const param = new URLSearchParams(window.location.search).get("lang");
    const initial = [param, stored].find(isLang) ?? (navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en");
    setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
