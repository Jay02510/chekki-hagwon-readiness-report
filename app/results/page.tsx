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
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, hagwon, contact,
        score: result.weightedTotal,
        band: result.band.name,
        weakestPillar: result.weakestPillar.name,
      }),
    });
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

      {!submitted ? (
        <div className="border-t border-line pt-6">
          <p className="font-body text-sm text-ink/70 mb-4">
            Want a quick note on what to try first? Leave your info and I'll follow up directly.
          </p>
          <div className="space-y-3 mb-4">
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Hagwon name"
              value={hagwon} onChange={(e) => setHagwon(e.target.value)} />
            <input className="w-full border border-line rounded-sm px-4 py-2 font-body focus-visible:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-paper" placeholder="Phone or KakaoTalk ID"
              value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <button onClick={submit} className="bg-forest text-paper font-body px-6 py-3 rounded-sm hover:bg-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
            Send my results
          </button>
        </div>
      ) : (
        <p className="font-body text-forest">Thanks — I'll be in touch.</p>
      )}
    </div>
  );
}
