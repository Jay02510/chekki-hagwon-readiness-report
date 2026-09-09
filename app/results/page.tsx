"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreAssessment, Answers } from "@/lib/scoring";
import { questions, Pillar } from "@/lib/questions";
import { useLang, pick } from "@/lib/i18n";
import { strings } from "@/lib/strings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function Results() {
  const { lang } = useLang();
  const t = strings[lang];
  const [result, setResult] = useState<ReturnType<typeof scoreAssessment> | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [hagwon, setHagwon] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("hagwon-readiness-answers");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Answers;
      setAnswers(parsed);
      setResult(scoreAssessment(parsed));
    } catch {
      // malformed/stale data — fall back to the "no results" state
    }
  }, []);

  // The lowest-scoring answered question within a pillar — used to open that
  // pillar's opportunity with the director's actual answer instead of a
  // generic, score-band-only recommendation. Applied to every pillar, not
  // just the weakest, so the whole report reads as specific to their answers.
  function worstAnswer(pillarId: string): { questionId: string; text: string } | null {
    let worst: { questionId: string; text: string } | null = null;
    let worstPoints = Infinity;
    for (const q of questions.filter((q) => q.pillarId === pillarId)) {
      const opt = q.options.find((o) => o.label === answers[q.id]);
      if (opt && opt.points < worstPoints) {
        worstPoints = opt.points;
        worst = { questionId: q.id, text: pick(opt.text, lang) };
      }
    }
    return worst;
  }

  // A pillar can span more than one underlying problem (teaching covers both
  // in-class leveled tracks and the homework question) — pillar.nextStep only
  // fits one of them, so swap in nextStepByQuestion when the quoted answer
  // came from a question that needs a different recommendation.
  function personalizedStepFor(pillar: Pillar, fallbackNextStep: string): string {
    const worst = worstAnswer(pillar.id);
    if (!worst) return fallbackNextStep;
    const override = pillar.nextStepByQuestion?.[worst.questionId];
    const stepText = override ? pick(override, lang) : fallbackNextStep;
    return t.youMentioned(worst.text) + stepText;
  }

  async function submit() {
    if (!result) return;
    setError("");
    if (!EMAIL_RE.test(email)) {
      setError(t.emailError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, hagwon, contact, email, feedback, lang,
          score: result.weightedTotal,
          band: pick(result.band.name, lang),
          bandIntro: pick(result.band.intro, lang),
          weakestPillar: pick(result.weakestPillar.name, lang),
          weakestPillarId: result.weakestPillar.id,
          weakestBlurb: pick(result.weakestPillar.weakestBlurb, lang),
          weakestNextStep: personalizedNextStep,
          weakestNextStep2: pick(result.weakestPillar.nextStep2, lang),
          closingQuestion: closingText,
          disclaimer: t.disclaimer,
          // The weakest pillar gets its own section above with the full
          // score and copy — drop it from this table entirely instead of
          // repeating its score row a second time.
          pillarResults: result.pillarResults
            .filter((p) => p.pillar.id !== result.weakestPillar.id)
            .map((p) => ({
            name: pick(p.pillar.name, lang),
            raw: p.raw,
            maxRaw: p.maxRaw,
            isStrong: p.isStrong,
            blurb: p.isStrong ? null : pick(p.pillar.weakestBlurb, lang),
            nextStep: p.isStrong ? null : personalizedStepFor(p.pillar, pick(p.pillar.nextStep, lang)),
          })),
        }),
      });
      if (res.status === 429) {
        setError(t.rateLimitError);
        return;
      }
      if (!res.ok) {
        setError(t.emailError);
        return;
      }
      const data = await res.json();
      if (data.id) setReportId(data.id);
      setSubmitted(true);
      window.gtag?.("event", "generate_lead", {
        score: result.weightedTotal,
        band: pick(result.band.name, lang),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!result) {
    return (
      <div>
        <p className="font-display font-black text-2xl text-text-main mb-4">{t.noResultsTitle}</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-8">{t.noResultsBody}</p>
        <Link
          href="/assessment"
          className="inline-block bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
        >
          {t.takeAssessment}
        </Link>
      </div>
    );
  }

  const personalizedNextStep = personalizedStepFor(result.weakestPillar, pick(result.weakestPillar.nextStep, lang));
  // Two shipped products map to two pillars: Chekki Schools (a school-run
  // tool) fits parentComm, the parent-facing homework helper fits teaching
  // — pitched as a partnership since the director isn't the end user, they'd
  // be introducing it to parents. Every other pillar routes to a call.
  const isSchoolsFit = result.weakestPillar.id === "parentComm";
  const isHomeworkFit = result.weakestPillar.id === "teaching";
  const closingText = isSchoolsFit
    ? t.closingSchools(pick(result.weakestPillar.name, lang))
    : isHomeworkFit
    ? t.closingHomework
    : t.closingOther(pick(result.weakestPillar.name, lang));
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

  return (
    <div>
      <Link
        href="/"
        className="font-body text-sm text-text-muted hover:text-text-main transition-colors mb-6 inline-block"
      >
        ← {t.backHome}
      </Link>
      <p className="font-body text-sm text-brand-orange mb-3">{t.yourResult}</p>
      <p className="font-display font-black text-6xl text-text-main mb-2">{result.weightedTotal}</p>
      <p className="font-body text-text-muted mb-8">{t.outOf}</p>

      <h1 className="font-display font-black text-3xl text-text-main mb-2">{pick(result.band.name, lang)}</h1>
      <p className="font-body text-text-main/90 leading-relaxed mb-4">{pick(result.band.intro, lang)}</p>
      <p className="font-body text-text-main/80 leading-relaxed mb-4">{pick(result.band.blurb, lang)}</p>
      <p className="font-body text-xs text-text-muted leading-relaxed mb-8">{t.disclaimer}</p>

      <div className="border-t border-brand-border pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-2">{t.weakestPillarLabel}</p>
        <p className="font-display font-black text-xl text-text-main mb-2">{pick(result.weakestPillar.name, lang)}</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-3">{pick(result.weakestPillar.weakestBlurb, lang)}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed">{personalizedNextStep}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-2">{pick(result.weakestPillar.nextStep2, lang)}</p>
      </div>

      {submitted && (
        <div className="border-t border-brand-border pt-6 mb-10">
          <p className="font-body text-sm text-brand-orange mb-4">{t.allPillars}</p>
          <div className="space-y-5">
            {result.pillarResults
              .filter(({ pillar }) => pillar.id !== result.weakestPillar.id)
              .map(({ pillar, raw, maxRaw, isStrong }) => (
              <div key={pillar.id}>
                <div className="flex justify-between font-body text-sm text-text-main mb-1">
                  <span>{pick(pillar.name, lang)}</span>
                  <span className="text-text-muted">{raw}/{maxRaw}</span>
                </div>
                {isStrong ? (
                  <p className="font-body text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">{t.strongNote}</p>
                ) : (
                  <>
                    <p className="font-body text-sm text-text-main/70 leading-relaxed">{pick(pillar.weakestBlurb, lang)}</p>
                    <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-1">
                      {personalizedStepFor(pillar, pick(pillar.nextStep, lang))}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!submitted ? (
        <div className="border-t border-brand-border pt-6">
          <p className="font-body text-sm text-text-main/70 mb-4">{t.leadIn}</p>
          <div className="space-y-3 mb-4">
            <input className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder={t.namePlaceholder}
              value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder={t.hagwonPlaceholder}
              value={hagwon} onChange={(e) => setHagwon(e.target.value)} />
            <input type="email" required className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder={t.emailPlaceholder}
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder={t.contactPlaceholder}
              value={contact} onChange={(e) => setContact(e.target.value)} />
            <textarea className="w-full bg-brand-card border border-brand-border rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder={t.feedbackPlaceholder} rows={3}
              value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          {error && <p className="font-body text-sm text-red-400 mb-3">{error}</p>}
          <button
            onClick={submit}
            disabled={!email || submitting}
            className={`bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark disabled:active:scale-100 ${
              submitting ? "opacity-70 cursor-wait" : !email ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {submitting ? t.submittingBtn : t.submitBtn}
          </button>
        </div>
      ) : (
        <div>
          <p className="font-body text-brand-orange mb-3">{t.thanks}</p>
          {reportId && (
            <p className="font-body text-xs text-text-muted leading-relaxed mb-4">
              {t.permalinkLabel}
              <br />
              <a href={`/results/${reportId}`} className="text-brand-orange hover:underline break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/results/{reportId}
              </a>
            </p>
          )}
          <p className="font-body text-sm text-text-main/70 leading-relaxed mb-4">{closingText}</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <a
                href={isHomeworkFit ? "https://chekkiai.com" : "https://chekkiai.com/schools"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-orange text-black font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
              >
                {t.ctaTry}
              </a>
              <p className="font-body text-xs text-text-muted mt-1.5">{t.ctaTryCaption}</p>
            </div>
            <div>
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-brand-orange text-black font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                >
                  {t.ctaBook}
                </a>
              ) : (
                process.env.NEXT_PUBLIC_NOTIFY_EMAIL && (
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_NOTIFY_EMAIL}?subject=${encodeURIComponent(
                      `${t.ctaBook} — ${hagwon || name || email}`
                    )}&body=${encodeURIComponent(t.ctaBookBody(result.weightedTotal))}`}
                    className="inline-block bg-brand-orange text-black font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                  >
                    {t.ctaBook}
                  </a>
                )
              )}
              <p className="font-body text-xs text-text-muted mt-1.5">{t.ctaBookCaption(pick(result.weakestPillar.name, lang))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
