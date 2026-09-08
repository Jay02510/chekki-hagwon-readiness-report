"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreAssessment, Answers } from "@/lib/scoring";
import { useLang, pick } from "@/lib/i18n";
import { strings } from "@/lib/strings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Results() {
  const { lang } = useLang();
  const t = strings[lang];
  const [result, setResult] = useState<ReturnType<typeof scoreAssessment> | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [hagwon, setHagwon] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hagwon-readiness-answers");
    if (!raw) return;
    try {
      setResult(scoreAssessment(JSON.parse(raw) as Answers));
    } catch {
      // malformed/stale data — fall back to the "no results" state
    }
  }, []);

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
          weakestBlurb: pick(result.weakestPillar.weakestBlurb, lang),
          weakestNextStep: pick(result.weakestPillar.nextStep, lang),
          weakestNextStep2: pick(result.weakestPillar.nextStep2, lang),
          closingQuestion: t.closingQuestion,
          // The weakest pillar's blurb/next-step are sent separately above and
          // get their own section in the email — omit them here so they're
          // not shown twice in the per-pillar table.
          pillarResults: result.pillarResults.map((p) => ({
            name: pick(p.pillar.name, lang),
            raw: p.raw,
            maxRaw: p.maxRaw,
            blurb: p.isStrong || p.pillar.id === result.weakestPillar.id ? null : pick(p.pillar.weakestBlurb, lang),
            nextStep: p.isStrong || p.pillar.id === result.weakestPillar.id ? null : pick(p.pillar.nextStep, lang),
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
      setSubmitted(true);
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
      <p className="font-body text-text-main/80 leading-relaxed mb-8">{pick(result.band.blurb, lang)}</p>

      <div className="border-t border-brand-border pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-2">{t.weakestPillarLabel}</p>
        <p className="font-display font-black text-xl text-text-main mb-2">{pick(result.weakestPillar.name, lang)}</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-3">{pick(result.weakestPillar.weakestBlurb, lang)}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed">{pick(result.weakestPillar.nextStep, lang)}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-2">{pick(result.weakestPillar.nextStep2, lang)}</p>
      </div>

      {submitted && (
        <div className="border-t border-brand-border pt-6 mb-10">
          <p className="font-body text-sm text-brand-orange mb-4">{t.allPillars}</p>
          <div className="space-y-5">
            {result.pillarResults.map(({ pillar, raw, maxRaw, isStrong }) => (
              <div key={pillar.id}>
                <div className="flex justify-between font-body text-sm text-text-main mb-1">
                  <span>{pick(pillar.name, lang)}</span>
                  <span className="text-text-muted">{raw}/{maxRaw}</span>
                </div>
                {!isStrong && pillar.id !== result.weakestPillar.id && (
                  <>
                    <p className="font-body text-sm text-text-main/70 leading-relaxed">{pick(pillar.weakestBlurb, lang)}</p>
                    <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-1">{pick(pillar.nextStep, lang)}</p>
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
          <p className="font-body text-sm text-text-main/70 leading-relaxed">{t.closingQuestion}</p>
        </div>
      )}
    </div>
  );
}
