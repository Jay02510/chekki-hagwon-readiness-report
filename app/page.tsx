import Link from "next/link";

export default function Landing() {
  return (
    <div>
      <p className="font-body text-sm text-forest mb-3">Hagwon AI Readiness Index</p>
      <h1 className="font-display text-4xl leading-tight text-ink mb-6">
        Where does your hagwon actually stand today?
      </h1>
      <p className="font-body text-ink/80 mb-3 leading-relaxed">
        Sixteen questions about how you run things now — reporting, attendance,
        marketing, safety. Takes about four minutes. At the end you'll get a
        score and a clear read on where to focus first.
      </p>
      <p className="font-body text-sm text-ink/50 mb-8 leading-relaxed">
        A quick gut-check based on patterns we see across hagwons — not a formal audit.
      </p>
      <Link
        href="/assessment"
        className="inline-block bg-forest text-paper font-body px-6 py-3 rounded-sm hover:bg-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Start the assessment
      </Link>
    </div>
  );
}
