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
        <p className="font-display text-2xl text-ink mb-4">No results found</p>
        <p className="font-body text-ink/80 leading-relaxed mb-8">
          Looks like you haven't taken the assessment yet, or your answers expired.
        </p>
        <Link
          href="/assessment"
          className="inline-block bg-forest text-paper font-body px-6 py-3 rounded-sm hover:bg-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Take the assessment
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-sm text-forest mb-3">Your result</p>
      <p className="font-display text-6xl text-ink mb-2">{result.weightedTotal}</p>
      <p className="font-body text-ink/60 mb-8">out of 72</p>

      <h1 className="font-display text-3xl text-ink mb-4">{result.band.name}</h1>
      <p className="font-body text-ink/80 leading-relaxed mb-8">{result.band.blurb}</p>

      <div className="border-t border-line pt-6 mb-10">
        <p className="font-body text-sm text-amber mb-2">Your weakest pillar</p>
        <p className="font-display text-xl text-ink mb-2">{result.weakestPillar.name}</p>
        <p className="font-body text-ink/80 leading-relaxed">{result.weakestPillar.weakestBlurb}</p>
      </div>

      <div className="border-t border-line pt-6 mb-10">
        <p className="font-body text-sm text-forest mb-4">All seven pillars</p>
        <div className="space-y-5">
          {result.pillarResults.map(({ pillar, raw, maxRaw, isStrong }) => (
            <div key={pillar.id}>
              <div className="flex justify-between font-body text-sm text-ink mb-1">
                <span>{pillar.name}</span>
                <span className="text-ink/50">{raw}/{maxRaw}</span>
              </div>
              {!isStrong && (
                <p className="font-body text-sm text-ink/70 leading-relaxed">{pillar.weakestBlurb}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {!submitted ? (
        <div className="border-t border-line pt-6">
          <p className="font-body text-sm text-ink/70 mb-4">
            Want the full breakdown in your inbox? Leave your info and I'll send it over and follow up directly.
          </p>
          <div className="space-y-3 mb-4">
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Hagwon name"
              value={hagwon} onChange={(e) => setHagwon(e.target.value)} />
            <input type="email" required className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Email (for your report)"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Phone or KakaoTalk ID (optional)"
              value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          {error && <p className="font-body text-sm text-red-700 mb-3">{error}</p>}
          <button onClick={submit} disabled={!email} className="bg-forest text-paper font-body px-6 py-3 rounded-sm hover:bg-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:cursor-not-allowed">
            Email me the full report
          </button>
        </div>
      ) : (
        <p className="font-body text-forest">Thanks — check your inbox for the full report, and I'll follow up directly.</p>
      )}
    </div>
  );
}
