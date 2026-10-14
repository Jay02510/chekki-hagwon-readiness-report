"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { questions, pillars } from "@/lib/questions";
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
  const pillarIndex = pillars.findIndex((p) => p.id === q.pillarId);

  function choose(label: "A" | "B" | "C" | "D") {
    const next = { ...answers, [q.id]: label };
    setAnswers(next);

    if (step + 1 < questions.length) {
      setStep(step + 1);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step: step + 1, answers: next }));
    } else {
      localStorage.removeItem(PROGRESS_KEY);
      window.gtag?.("event", "quiz_complete");
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
        <button onClick={goBack} className="back-link mb-4">
          ← {strings[lang].back}
        </button>
      ) : (
        <Link href="/" className="back-link mb-4">
          ← {strings[lang].backHome}
        </Link>
      )}
      <ProgressBar current={step + 1} total={questions.length} />
      {/* Names the area each question belongs to, so questions outside the
          safety/communication framing on the landing page don't feel off-topic. */}
      <p className="eyebrow mb-2">
        {strings[lang].pillarOf(pillarIndex + 1, pillars.length, pick(pillars[pillarIndex].name, lang))}
      </p>
      <h2 className="mb-6 text-[22px] font-extrabold leading-[1.25] tracking-[-0.02em]">{pick(q.prompt, lang)}</h2>
      <div className="space-y-3">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => choose(opt.label)}
            aria-pressed={answers[q.id] === opt.label}
            className={`min-h-14 w-full rounded-md px-5 py-3.5 text-left font-semibold transition-[transform,box-shadow] active:scale-[0.98] ${
              answers[q.id] === opt.label ? "bg-line-soft ring-2 ring-inset ring-line" : "bg-surface ring-1 ring-inset ring-rule hover:ring-ink-3"
            }`}
          >
            {pick(opt.text, lang)}
          </button>
        ))}
      </div>
      <p className="caption mt-4">{strings[lang].noneMatchHint}</p>
    </div>
  );
}
