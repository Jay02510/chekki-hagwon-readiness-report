import Link from "next/link";
import { adminDb } from "@/lib/firebaseAdmin";
import { bands } from "@/lib/scoring";
import { pillars } from "@/lib/questions";

export const dynamic = "force-dynamic";

type Submission = {
  name: string;
  hagwon: string;
  email: string;
  contact: string;
  feedback: string | null;
  score: number;
  band: string;
  bandId?: string;
  weakestPillar: string;
  weakestPillarId?: string;
  lang: "en" | "ko";
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
};

// band/weakestPillar are stored in the visitor's language, so group on ids.
// Docs from before bandId existed fall back to matching either language's name.
function bandIdOf(r: Submission): string {
  return r.bandId ?? bands.find((b) => b.name.en === r.band || b.name.ko === r.band)?.id ?? r.band;
}
function pillarIdOf(r: Submission): string {
  return (
    r.weakestPillarId ??
    pillars.find((p) => p.name.en === r.weakestPillar || p.name.ko === r.weakestPillar)?.id ??
    r.weakestPillar
  );
}
const bandName = (id: string) => bands.find((b) => b.id === id)?.name.en ?? id;
const pillarName = (id: string) => pillars.find((p) => p.id === id)?.name.en ?? id;

function quartile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="caption mb-1">{label}</p>
      <p className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">{value}</p>
      {sub && <p className="caption mt-1 font-semibold">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = Math.max(1, ...entries.map(([, c]) => c));
  return (
    <div className="card">
      <p className="caption mb-3">{title}</p>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-[14px] text-ink-3">No data yet</p>}
        {entries.map(([label, count]) => (
          <div key={label} className="flex items-center gap-3 text-[14px]">
            <span className="w-40 shrink-0 truncate" title={label}>{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-line" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right tabular-nums text-ink-2">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BAND_STYLES: Record<string, string> = {
  traditional: "text-ink-2 ring-1 ring-inset ring-rule",
  digitizing: "bg-sunken text-ink-2",
  techEnabled: "bg-line-soft text-line-ink",
  aiReady: "bg-right-soft text-correct",
};

function BandBadge({ bandId }: { bandId: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-bold ${BAND_STYLES[bandId] ?? "text-ink-2"}`}>
      {bandName(bandId)}
    </span>
  );
}

export default async function AdminDashboard() {
  const snap = await adminDb.collection("readiness_submissions").orderBy("createdAt", "desc").get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Submission) }));

  const scores = rows.map((r) => r.score).sort((a, b) => a - b);
  const byBand: Record<string, number> = {};
  const byWeakest: Record<string, number> = {};
  const byLang: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  for (const r of rows) {
    const band = bandName(bandIdOf(r));
    const weakest = pillarName(pillarIdOf(r));
    byBand[band] = (byBand[band] ?? 0) + 1;
    byWeakest[weakest] = (byWeakest[weakest] ?? 0) + 1;
    byLang[r.lang || "en"] = (byLang[r.lang || "en"] ?? 0) + 1;
    bySource[r.utmSource || "(none)"] = (bySource[r.utmSource || "(none)"] ?? 0) + 1;
    const day = r.createdAt.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const sortDesc = (m: Record<string, number>) => Object.entries(m).sort(([, a], [, b]) => b - a);
  const days = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);
  const todayCount = byDay[new Date().toISOString().slice(0, 10)] ?? 0;
  const maxDay = Math.max(1, ...days.map(([, c]) => c));

  return (
    <div>
      <h1 className="mb-6 text-[28px] font-extrabold tracking-[-0.02em]">Submissions</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={String(rows.length)} sub={`${todayCount} today`} />
        <StatCard
          label="Median score"
          value={scores.length ? `${quartile(scores, 0.5)}/84` : "—"}
          sub={scores.length ? `range ${scores[0]}–${scores[scores.length - 1]}` : undefined}
        />
        <StatCard label="Top weakest pillar" value={sortDesc(byWeakest)[0]?.[0] ?? "—"} />
        <StatCard label="Top channel" value={sortDesc(bySource)[0]?.[0] ?? "—"} />
      </div>

      {rows.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <Breakdown title="By band" entries={sortDesc(byBand)} />
          <Breakdown title="Weakest pillar" entries={sortDesc(byWeakest)} />
          <Breakdown title="By language" entries={sortDesc(byLang)} />
          <Breakdown title="By UTM source" entries={sortDesc(bySource)} />
        </div>
      )}

      {days.length > 0 && (
        <div className="card mb-10">
          <p className="caption mb-3">Last 14 days</p>
          <div className="flex items-end gap-2 h-24">
            {[...days].reverse().map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                <div
                  className="w-full rounded-t bg-line"
                  style={{ height: `${(count / maxDay) * 80}px` }}
                />
                <span className="text-[12px] tabular-nums text-ink-3">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-rule">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule text-[13px] text-ink-3">
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Hagwon</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Contact</th>
                <th className="py-3 px-4 font-bold">Lang</th>
                <th className="py-3 px-4 font-bold">Score</th>
                <th className="py-3 px-4 font-bold">Band</th>
                <th className="py-3 px-4 font-bold">Weakest</th>
                <th className="py-3 px-4 font-bold">Source</th>
                <th className="py-3 px-4 font-bold">Feedback</th>
                <th className="py-3 px-4 font-bold">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-0">
                  <td className="py-3 px-4 whitespace-nowrap text-ink-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-bold">{r.hagwon || r.name}</td>
                  <td className="py-3 px-4 text-ink-2">{r.email}</td>
                  <td className="py-3 px-4 text-ink-2">{r.contact || "—"}</td>
                  <td className="py-3 px-4 text-ink-2 uppercase text-xs">{r.lang || "en"}</td>
                  <td className="py-3 px-4 font-semibold tabular-nums">{r.score}/84</td>
                  <td className="py-3 px-4">
                    <BandBadge bandId={bandIdOf(r)} />
                  </td>
                  <td className="py-3 px-4 text-ink-2">{pillarName(pillarIdOf(r))}</td>
                  <td className="py-3 px-4 text-ink-2">{r.utmSource || "—"}</td>
                  <td className="py-3 px-4 text-ink-2 max-w-xs truncate" title={r.feedback ?? ""}>
                    {r.feedback || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/results/${r.id}`} className="font-semibold text-line-ink hover:underline">
                      view
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 px-4 text-center text-ink-2">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
