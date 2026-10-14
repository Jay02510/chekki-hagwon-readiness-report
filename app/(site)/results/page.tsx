"use client";

import { useEffect, useMemo, useState } from "react";
import type { Answers } from "@/lib/scoring";
import { buildReport, isCompleteAnswers } from "@/lib/report";
import { useLang } from "@/lib/i18n";
import { strings } from "@/lib/strings";
import { getUtm } from "@/lib/utm";
import Report, { BackHome, NoResults } from "@/components/Report";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function Results() {
  const { lang } = useLang();
  const t = strings[lang];
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [name, setName] = useState("");
  const [hagwon, setHagwon] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ id: string | null; emailed: boolean } | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("hagwon-readiness-answers") ?? "null");
      if (isCompleteAnswers(parsed)) setAnswers(parsed);
    } catch {
      // malformed/stale data — fall back to the "no results" state
    }
  }, []);

  // Same builder the API uses, so what's on screen is what gets emailed.
  const report = useMemo(() => (answers ? buildReport(answers, lang) : null), [answers, lang]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!report) return;
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
        body: JSON.stringify({ name, hagwon, contact, email, feedback, lang, utm: getUtm(), answers }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? t.rateLimitError : res.status === 400 ? t.emailError : t.submitError);
        return;
      }
      const data = await res.json();
      setSent({ id: data.id ?? null, emailed: Boolean(data.emailed) });
      window.gtag?.("event", "generate_lead", { score: report.score, band: report.bandId });
    } catch {
      setError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!report) return <NoResults lang={lang} />;

  const fields: [string, string, (v: string) => void, string, string][] = [
    [t.nameLabel, name, setName, "text", "name"],
    [t.hagwonLabel, hagwon, setHagwon, "text", "organization"],
    [t.emailLabel, email, setEmail, "email", "email"],
    [t.contactLabel, contact, setContact, "text", "tel"],
  ];

  return (
    <div>
      <BackHome lang={lang} />
      <Report report={report} full={Boolean(sent)} bookSubject={hagwon || name || email}>
        {sent && (
          <div className="mt-8 rounded-md bg-line-soft px-4 py-3">
            <p className="font-bold">{sent.emailed ? t.thanks : t.thanksNoEmail}</p>
            {sent.id && (
              <p className="mt-2 text-[14px] text-ink-2">
                {t.permalinkLabel}
                <br />
                <a href={`/results/${sent.id}`} className="break-all font-semibold text-line-ink underline">
                  {window.location.origin}/results/{sent.id}
                </a>
              </p>
            )}
          </div>
        )}
      </Report>

      {!sent && (
        <form onSubmit={submit} noValidate className="mt-10 border-t border-rule pt-7">
          <p className="mb-5 text-ink-2">{t.leadIn}</p>
          <div className="mb-5 space-y-4">
            {fields.map(([label, value, set, type, autoComplete]) => (
              <label key={autoComplete} className="block">
                <span className="caption mb-1.5 block">{label}</span>
                <input
                  className="field"
                  type={type}
                  autoComplete={autoComplete}
                  required={type === "email"}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </label>
            ))}
            <label className="block">
              <span className="caption mb-1.5 block">{t.feedbackLabel}</span>
              <textarea className="field py-3" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </label>
          </div>
          {error && (
            <p role="alert" className="mb-3 text-[14px] font-bold text-wrong">
              {error}
            </p>
          )}
          <button type="submit" disabled={!email || submitting} className={`btn ${submitting ? "cursor-wait" : ""}`}>
            {submitting ? t.submittingBtn : t.submitBtn}
          </button>
        </form>
      )}
    </div>
  );
}
