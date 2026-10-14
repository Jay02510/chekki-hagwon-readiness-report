import Link from "next/link";
import { strings } from "@/lib/strings";
import { productHref, type Report as ReportData } from "@/lib/report";
import type { Lang } from "@/lib/i18n";

// One report layout for both the live results page and the /results/[id]
// permalink. No hooks, so it renders on the server and the client alike.
export default function Report({
  report,
  full,
  bookSubject,
  children,
}: {
  report: ReportData;
  // The other pillars, closing note and CTAs — the live page holds these
  // back until the lead form is sent.
  full: boolean;
  bookSubject?: string;
  // Rendered between the pillar list and the closing note (the live page's
  // thank-you and permalink).
  children?: React.ReactNode;
}) {
  const t = strings[report.lang] ?? strings.en;
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
  const notifyEmail = process.env.NEXT_PUBLIC_NOTIFY_EMAIL;
  const bookHref =
    bookingUrl ??
    (notifyEmail
      ? `mailto:${notifyEmail}?subject=${encodeURIComponent(`${t.ctaBook} — ${bookSubject || report.weakestPillar}`)}&body=${encodeURIComponent(
          t.ctaBookBody(report.score)
        )}`
      : null);

  return (
    <>
      <p className="eyebrow">{t.yourResult}</p>
      <p className="mt-2 text-[56px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
        {report.score}
        <span className="ml-2 text-[17px] font-semibold tracking-normal text-ink-3">{t.outOf}</span>
      </p>

      <h1 className="mt-6 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[34px]">{report.band}</h1>
      <p className="mt-3">{report.bandIntro}</p>
      {report.bandBlurb && <p className="mt-3 text-ink-2">{report.bandBlurb}</p>}
      <p className="mt-3 text-[13px] font-semibold text-ink-3">{report.disclaimer}</p>

      {report.safetyComm && (
        <section className="card mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[17px] font-extrabold">{t.safetyCommLabel}</h2>
            <span className="font-semibold tabular-nums text-ink-2">
              {report.safetyComm.raw}/{report.safetyComm.maxRaw}
            </span>
          </div>
          <p className="mt-2 text-ink-2">{t.safetyCommNote}</p>
        </section>
      )}

      <section className="mt-7">
        <h2 className="caption mb-2.5">{t.weakestPillarLabel}</h2>
        <div className="card">
          <h3 className="text-[17px] font-extrabold">{report.weakestPillar}</h3>
          <p className="mt-2 text-ink-2">{report.weakestBlurb}</p>
          <ol className="mt-4 space-y-3 rounded-md bg-line-soft px-4 py-3">
            {[report.weakestNextStep, report.weakestNextStep2].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="roundel mt-0.5">{i + 1}</span>
                <span className="font-semibold">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {full && (
        <section className="mt-7">
          <h2 className="caption mb-2.5">{t.allPillars}</h2>
          <ul className="card divide-y divide-rule py-0">
            {report.pillarResults.map((p) => (
              <li key={p.name} className="py-4">
                <div className="flex justify-between gap-4 font-bold">
                  <span>{p.name}</span>
                  <span className="font-semibold tabular-nums text-ink-2">
                    {p.raw}/{p.maxRaw}
                  </span>
                </div>
                {p.isStrong ? (
                  <p className="mt-1 text-[14px] font-semibold text-correct">{t.strongNote}</p>
                ) : (
                  <>
                    {p.blurb && <p className="mt-1 text-[14px] text-ink-2">{p.blurb}</p>}
                    {p.nextStep && <p className="mt-1.5 text-[14px] font-semibold text-line-ink">{p.nextStep}</p>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {children}

      {full && (
        <section className="mt-8">
          <p className="text-ink-2">{report.closingQuestion}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
            <div>
              <a href={productHref(report.weakestPillarId)} target="_blank" rel="noopener noreferrer" className="btn">
                {t.ctaTry}
              </a>
              <p className="caption mt-1.5">{t.ctaTryCaption}</p>
            </div>
            {bookHref && (
              <div>
                <a
                  href={bookHref}
                  {...(bookingUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="btn-outline"
                >
                  {t.ctaBook}
                </a>
                <p className="caption mt-1.5">{t.ctaBookCaption(report.weakestPillar)}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export function NoResults({ lang }: { lang: Lang }) {
  const t = strings[lang];
  return (
    <div>
      <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em]">{t.noResultsTitle}</h1>
      <p className="mt-3 text-ink-2">{t.noResultsBody}</p>
      <Link href="/assessment" className="btn mt-8">
        {t.takeAssessment}
      </Link>
    </div>
  );
}

export function BackHome({ lang }: { lang: Lang }) {
  return (
    <Link href="/" className="back-link mb-4">
      ← {strings[lang].backHome}
    </Link>
  );
}
