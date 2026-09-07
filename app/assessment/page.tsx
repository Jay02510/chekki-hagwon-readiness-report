"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/scoring";
import { useLang, pick } from "@/lib/i18n";
import { strings } from "@/lib/strings";
import ProgressBar from "@/components/ProgressBar";

export default function Assessment() {
  const router = useRouter();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const q = questions[step];

  function choose(label: "A" | "B" | "C" | "D") {
    const next = { ...answers, [q.id]: label };
    setAnswers(next);

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      localStorage.setItem("hagwon-readiness-answers", JSON.stringify(next));
      router.push("/results");
    }
  }

  return (
    <div>
      <ProgressBar current={step + 1} total={questions.length} />
      <h2 className="font-display font-black text-2xl text-text-main mb-8 leading-snug">{pick(q.prompt, lang)}</h2>
      <div className="space-y-3">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => choose(opt.label)}
            className="w-full text-left font-body px-5 py-4 bg-brand-card border border-white/10 rounded-2xl hover:border-brand-orange/50 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
          >
            {pick(opt.text, lang)}
          </button>
        ))}
      </div>
      <p className="font-body text-xs text-text-muted mt-4">{strings[lang].noneMatchHint}</p>
    </div>
  );
}
