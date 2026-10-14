import { adminDb } from "@/lib/firebaseAdmin";
import type { Report as ReportData } from "@/lib/report";
import Report, { BackHome, NoResults } from "@/components/Report";

// Reports hold a director's name and scores — reachable by link, not search.
export const metadata = { robots: { index: false, follow: false } };

// A permalink back to a submitted report — the Firestore doc already holds
// the full rendered snapshot (see app/api/submit/route.ts), so this just
// reads it back instead of recomputing from localStorage-only answers.
export default async function ReportPermalink({ params }: { params: { id: string } }) {
  const doc = process.env.FIREBASE_SERVICE_ACCOUNT
    ? await adminDb.collection("readiness_submissions").doc(params.id).get()
    : null;
  if (!doc?.exists) return <NoResults lang="en" />;

  const data = doc.data() as ReportData;
  // Older docs predate bandBlurb/safetyComm, and lang was optional.
  const report: ReportData = {
    ...data,
    bandBlurb: data.bandBlurb ?? null,
    safetyComm: data.safetyComm ?? null,
    lang: data.lang === "ko" ? "ko" : "en",
  };

  return (
    <div>
      <BackHome lang={report.lang} />
      <Report report={report} full />
    </div>
  );
}
