"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreAssessment, Answers } from "@/lib/scoring";

export default function Results() {
  const [result, setResult] = useState<ReturnType<typeof scoreAssessment> | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [hagwon, setHagwon] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

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
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, hagwon, contact, email,
        score: result.weightedTotal,
        band: result.band.name,
        weakestPillar: result.weakestPillar.name,
        pillarResults: result.pillarResults.map((p) => ({
          name: p.pillar.name,
          raw: p.raw,
          maxRaw: p.maxRaw,
          blurb: p.isStrong ? null : p.pillar.weakestBlurb,
          chekkiNote: p.isStrong ? null : p.pillar.chekkiNote,
        })),
      }),
    });
    if (!res.ok) {
      setError("That email address doesn't look right — check it and try again.");
      return;
    }
    setSubmitted(true);
  }

  if (!result) {
    return (
      <div>
        <p className="font-display font-black text-2xl text-text-main mb-4">No results found</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-8">
          Looks like you haven't taken the assessment yet, or your answers expired.
        </p>
        <Link
          href="/assessment"
          className="inline-block bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
        >
          Take the assessment
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-sm text-brand-orange mb-3">Your result</p>
      <p className="font-display font-black text-6xl text-text-main mb-2">{result.weightedTotal}</p>
      <p className="font-body text-text-muted mb-8">out of 72</p>

      <h1 className="font-display font-black text-3xl text-text-main mb-4">{result.band.name}</h1>
      <p className="font-body text-text-main/80 leading-relaxed mb-8">{result.band.blurb}</p>

      <div className="border-t border-white/10 pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-2">Your weakest pillar</p>
        <p className="font-display font-black text-xl text-text-main mb-2">{result.weakestPillar.name}</p>
        <p className="font-body text-text-main/80 leading-relaxed">{result.weakestPillar.weakestBlurb}</p>
      </div>

      <div className="border-t border-white/10 pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-4">All seven pillars</p>
        <div className="space-y-5">
          {result.pillarResults.map(({ pillar, raw, maxRaw, isStrong }) => (
            <div key={pillar.id}>
              <div className="flex justify-between font-body text-sm text-text-main mb-1">
                <span>{pillar.name}</span>
                <span className="text-text-muted">{raw}/{maxRaw}</span>
              </div>
              {!isStrong && (
                <>
                  <p className="font-body text-sm text-text-main/70 leading-relaxed">{pillar.weakestBlurb}</p>
                  <p className="font-body text-sm text-text-muted leading-relaxed mt-1">{pillar.chekkiNote}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {!submitted ? (
        <div className="border-t border-white/10 pt-6">
          <p className="font-body text-sm text-text-main/70 mb-4">
            Want the full breakdown in your inbox? Leave your info and I'll send it over and follow up directly.
          </p>
          <div className="space-y-3 mb-4">
            <input className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder="Hagwon name"
              value={hagwon} onChange={(e) => setHagwon(e.target.value)} />
            <input type="email" required className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder="Email (for your report)"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-dark" placeholder="Phone or KakaoTalk ID (optional)"
              value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          {error && <p className="font-body text-sm text-red-400 mb-3">{error}</p>}
          <button onClick={submit} disabled={!email} className="bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
            Email me the full report
          </button>
        </div>
      ) : (
        <p className="font-body text-brand-orange">Thanks — check your inbox for the full report, and I'll follow up directly.</p>
      )}
    </div>
  );
}
