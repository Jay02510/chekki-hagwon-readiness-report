"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="inline-flex rounded-md bg-sunken p-0.5 ring-1 ring-inset ring-rule">
      {(["en", "ko"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          lang={l}
          className={`min-h-10 rounded px-3 text-[14px] font-semibold transition-colors ${
            lang === l ? "bg-sign text-on-sign" : "text-ink-2 hover:text-ink"
          }`}
        >
          {l === "en" ? "EN" : "한국어"}
        </button>
      ))}
    </div>
  );
}
