"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/scoring";
import { useLang, pick } from "@/lib/i18n";
import { strings } from "@/lib/strings";
import ProgressBar from "@/components/ProgressBar";
import { captureUtm } from "@/lib/utm";

const PROGRESS_KEY = "hagwon-readiness-progress";

export default function Assessment() {
  const router = useRouter();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  // Restore mid-quiz progress on mount so a refresh doesn't lose it.
  useEffect(() => {
    captureUtm();
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      window.gtag?.("event", "quiz_start");
      return;
    }
    try {
      const saved = JSON.parse(raw) as { step: number; answers: Answers };
      if (saved.step >= 0 && saved.step < questions.length) {
        setStep(saved.step);
        setAnswers(saved.answers);
      }
    } catch {
      // malformed/stale data — start fresh
    }
  }, []);

  const q = questions[step];

  function choose(label: "A" | "B" | "C" | "D") {
    const next = { ...answers, [q.id]: label };
    setAnswers(next);

    if (step + 1 < questions.length) {
      setStep(step + 1);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step: step + 1, answers: next }));
    } else {
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.setItem("hagwon-readiness-answers", JSON.stringify(next));
      router.push("/results");
    }
  }

  function goBack() {
    const prevStep = step - 1;
    setStep(prevStep);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step: prevStep, answers }));
  }

  return (
    <div>
      {step > 0 ? (
        <button
          onClick={goBack}
          className="font-body text-sm text-text-muted hover:text-text-main transition-colors mb-6"
        >
          ← {strings[lang].back}
        </button>
      ) : (
        <Link
          href="/"
          className="font-body text-sm text-text-muted hover:text-text-main transition-colors mb-6 inline-block"
        >
          ← {strings[lang].backHome}
        </Link>
      )}
      <ProgressBar current={step + 1} total={questions.length} />
      <h2 className="font-display font-black text-2xl text-text-main mb-8 leading-snug">{pick(q.prompt, lang)}</h2>
      <div className="space-y-3">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => choose(opt.label)}
            className={`w-full text-left font-body px-5 py-4 border rounded-2xl transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark ${
              answers[q.id] === opt.label
                ? "bg-brand-orange/10 border-brand-orange"
                : "bg-brand-card border-brand-border hover:border-brand-orange/50"
            }`}
          >
            {pick(opt.text, lang)}
          </button>
        ))}
      </div>
      <p className="font-body text-xs text-text-muted mt-4">{strings[lang].noneMatchHint}</p>
    </div>
  );
}
