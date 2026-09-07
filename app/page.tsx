import Link from "next/link";

export default function Landing() {
  return (
    <div>
      <p className="font-body text-sm text-brand-orange mb-3">Hagwon AI Readiness Index</p>
      <h1 className="font-display font-black text-4xl leading-tight text-text-main mb-6">
        See how AI-ready your hagwon already is.
      </h1>
      <p className="font-body text-text-main/80 mb-3 leading-relaxed">
        You're probably doing more right than you think. Four minutes shows
        your AI Readiness score, what's already working, and the one change
        that would move you furthest ahead.
      </p>
      <p className="font-body text-sm text-text-muted mb-8 leading-relaxed">
        A quick gut-check based on patterns we see across hagwons — not a formal audit.
      </p>
      <Link
        href="/assessment"
        className="inline-block bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
      >
        Check my AI Readiness score
      </Link>
    </div>
  );
}
