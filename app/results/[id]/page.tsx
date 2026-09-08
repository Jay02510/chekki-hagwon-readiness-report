import Link from "next/link";
import { adminDb } from "@/lib/firebaseAdmin";
import { strings } from "@/lib/strings";

type PillarRow = { name: string; raw: number; maxRaw: number; isStrong: boolean; blurb: string | null; nextStep: string | null };

type Report = {
  score: number;
  band: string;
  bandIntro: string;
  disclaimer: string;
  weakestPillar: string;
  weakestPillarId: string;
  weakestBlurb: string;
  weakestNextStep: string;
  weakestNextStep2: string;
  closingQuestion: string;
  pillarResults: PillarRow[];
  lang: "en" | "ko";
};

// A permalink back to a submitted report — the Firestore doc already holds
// the full rendered snapshot (see app/api/submit/route.ts), so this just
// reads it back instead of recomputing from localStorage-only answers.
export default async function ReportPermalink({ params }: { params: { id: string } }) {
  const doc = await adminDb.collection("readiness_submissions").doc(params.id).get();

  if (!doc.exists) {
    const t = strings.en;
    return (
      <div>
        <p className="font-display font-black text-2xl text-text-main mb-4">{t.noResultsTitle}</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-8">{t.noResultsBody}</p>
        <Link
          href="/assessment"
          className="inline-block bg-brand-orange text-black font-body font-semibold px-6 py-3 rounded-full transition-transform active:scale-[0.98] hover:opacity-90"
        >
          {t.takeAssessment}
        </Link>
      </div>
    );
  }

  const report = doc.data() as Report;
  const t = strings[report.lang] ?? strings.en;
  const isHomeworkFit = report.weakestPillarId === "teaching";
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
  const notifyEmail = process.env.NEXT_PUBLIC_NOTIFY_EMAIL;

  return (
    <div>
      <Link href="/" className="font-body text-sm text-text-muted hover:text-text-main transition-colors mb-6 inline-block">
        ← {t.backHome}
      </Link>
      <p className="font-body text-sm text-brand-orange mb-3">{t.yourResult}</p>
      <p className="font-display font-black text-6xl text-text-main mb-2">{report.score}</p>
      <p className="font-body text-text-muted mb-8">{t.outOf}</p>

      <h1 className="font-display font-black text-3xl text-text-main mb-2">{report.band}</h1>
      <p className="font-body text-text-main/90 leading-relaxed mb-4">{report.bandIntro}</p>
      <p className="font-body text-xs text-text-muted leading-relaxed mb-8">{report.disclaimer}</p>

      <div className="border-t border-brand-border pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-2">{t.weakestPillarLabel}</p>
        <p className="font-display font-black text-xl text-text-main mb-2">{report.weakestPillar}</p>
        <p className="font-body text-text-main/80 leading-relaxed mb-3">{report.weakestBlurb}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed">{report.weakestNextStep}</p>
        <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-2">{report.weakestNextStep2}</p>
      </div>

      <div className="border-t border-brand-border pt-6 mb-10">
        <p className="font-body text-sm text-brand-orange mb-4">{t.allPillars}</p>
        <div className="space-y-5">
          {report.pillarResults.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between font-body text-sm text-text-main mb-1">
                <span>{p.name}</span>
                <span className="text-text-muted">{p.raw}/{p.maxRaw}</span>
              </div>
              {p.isStrong ? (
                <p className="font-body text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">{t.strongNote}</p>
              ) : (
                <>
                  {p.blurb && <p className="font-body text-sm text-text-main/70 leading-relaxed">{p.blurb}</p>}
                  {p.nextStep && (
                    <p className="font-body text-sm text-brand-orange font-semibold leading-relaxed mt-1">{p.nextStep}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-brand-border pt-6">
        <p className="font-body text-sm text-text-main/70 leading-relaxed mb-4">{report.closingQuestion}</p>
        <div className="flex flex-wrap gap-6">
          <div>
            <a
              href={isHomeworkFit ? "https://chekkiai.com" : "https://chekkiai.com/schools"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-orange text-black font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90"
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
                className="inline-block border border-brand-orange text-brand-orange font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90"
              >
                {t.ctaBook}
              </a>
            ) : (
              notifyEmail && (
                <a
                  href={`mailto:${notifyEmail}?subject=${encodeURIComponent(`${t.ctaBook} — ${report.weakestPillar}`)}&body=${encodeURIComponent(
                    t.ctaBookBody(report.score)
                  )}`}
                  className="inline-block border border-brand-orange text-brand-orange font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-transform active:scale-[0.98] hover:opacity-90"
                >
                  {t.ctaBook}
                </a>
              )
            )}
            <p className="font-body text-xs text-text-muted mt-1.5">{t.ctaBookCaption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
