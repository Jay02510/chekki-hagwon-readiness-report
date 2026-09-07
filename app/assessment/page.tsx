"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/scoring";
import ProgressBar from "@/components/ProgressBar";

export default function Assessment() {
  const router = useRouter();
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
      <h2 className="font-display text-2xl text-ink mb-8 leading-snug">{q.prompt}</h2>
      <div className="space-y-3">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => choose(opt.label)}
            className="w-full text-left font-body px-5 py-4 border border-line rounded-sm hover:border-forest hover:bg-forest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
