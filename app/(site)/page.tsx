"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { strings } from "@/lib/strings";
import { captureUtm } from "@/lib/utm";

export default function Landing() {
  const { lang } = useLang();
  const t = strings[lang];

  useEffect(() => {
    captureUtm();
  }, []);

  return (
    <div>
      <p className="font-body text-sm text-brand-orange mb-3">{t.eyebrow}</p>
      <h1 className="font-display font-black text-4xl leading-tight text-text-main mb-6">
        {t.headline}
      </h1>
      <p className="font-body text-text-main/80 mb-8 leading-relaxed">{t.body}</p>
      <Link
        href="/assessment"
        className="inline-block bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
      >
        {t.cta}
      </Link>
    </div>
  );
}
