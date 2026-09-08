"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex justify-end mb-6">
      <div className="inline-flex bg-brand-card border border-brand-border rounded-full p-1 text-xs font-body">
        {(["en", "ko"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full transition-colors ${
              lang === l ? "bg-brand-orange text-black font-semibold" : "text-text-muted"
            }`}
          >
            {l === "en" ? "EN" : "한국어"}
          </button>
        ))}
      </div>
    </div>
  );
}
