"use client";

import { useLang } from "@/lib/i18n";
import { strings } from "@/lib/strings";

export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const { lang } = useLang();
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="caption mb-2 flex justify-between tabular-nums">
        <span>{strings[lang].questionOf(current, total)}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-rule"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div className="h-full bg-line transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
