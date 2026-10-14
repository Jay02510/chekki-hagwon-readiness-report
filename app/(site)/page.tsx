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
    <div className="pt-6 sm:pt-12">
      <p className="eyebrow mb-3">{t.eyebrow}</p>
      <h1 className="mb-5 text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">{t.headline}</h1>
      <p className="mb-8 text-[16px] text-ink-2">{t.body}</p>
      <Link href="/assessment" className="btn">
        {t.cta}
      </Link>
    </div>
  );
}
