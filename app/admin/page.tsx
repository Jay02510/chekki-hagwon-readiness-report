import Link from "next/link";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type Submission = {
  name: string;
  hagwon: string;
  email: string;
  contact: string;
  feedback: string | null;
  score: number;
  band: string;
  weakestPillar: string;
  lang: "en" | "ko";
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
};

function quartile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{label}</p>
      <p className="font-display font-black text-2xl text-text-main">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = Math.max(1, ...entries.map(([, c]) => c));
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-text-muted mb-3">{title}</p>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-text-muted">No data yet</p>}
        {entries.map(([label, count]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 truncate text-text-main">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-brand-border overflow-hidden">
              <div className="h-full bg-brand-orange rounded-full" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right text-text-muted">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BAND_STYLES: Record<string, string> = {
  "Traditional Hagwon": "bg-zinc-500/15 text-zinc-400",
  Digitizing: "bg-amber-500/15 text-amber-400",
};

function BandBadge({ band }: { band: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${BAND_STYLES[band] ?? "bg-brand-orange/15 text-brand-orange"}`}>
      {band}
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
    byBand[r.band] = (byBand[r.band] ?? 0) + 1;
    byWeakest[r.weakestPillar] = (byWeakest[r.weakestPillar] ?? 0) + 1;
    byLang[r.lang || "en"] = (byLang[r.lang || "en"] ?? 0) + 1;
    bySource[r.utmSource || "(none)"] = (bySource[r.utmSource || "(none)"] ?? 0) + 1;
    const day = r.createdAt.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const sortDesc = (m: Record<string, number>) => Object.entries(m).sort(([, a], [, b]) => b - a);
  const days = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);
  const todayCount = byDay[new Date().toISOString().slice(0, 10)] ?? 0;

  return (
    <div>
      <p className="font-display font-black text-3xl text-text-main mb-8">Submissions</p>

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
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 mb-10">
          <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Last 14 days</p>
          <div className="flex items-end gap-2 h-24">
            {[...days].reverse().map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                <div
                  className="w-full bg-brand-orange rounded-t"
                  style={{ height: `${(count / Math.max(...days.map(([, c]) => c))) * 80}px` }}
                />
                <span className="text-[10px] text-text-muted">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="text-text-muted border-b border-brand-border">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Hagwon</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Lang</th>
                <th className="py-3 px-4 font-medium">Score</th>
                <th className="py-3 px-4 font-medium">Band</th>
                <th className="py-3 px-4 font-medium">Weakest</th>
                <th className="py-3 px-4 font-medium">Source</th>
                <th className="py-3 px-4 font-medium">Feedback</th>
                <th className="py-3 px-4 font-medium">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-brand-border/50 last:border-0 ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
                  <td className="py-3 px-4 whitespace-nowrap text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-medium">{r.hagwon || r.name}</td>
                  <td className="py-3 px-4 text-text-muted">{r.email}</td>
                  <td className="py-3 px-4 text-text-muted">{r.contact || "—"}</td>
                  <td className="py-3 px-4 text-text-muted uppercase text-xs">{r.lang || "en"}</td>
                  <td className="py-3 px-4 font-semibold">{r.score}/84</td>
                  <td className="py-3 px-4">
                    <BandBadge band={r.band} />
                  </td>
                  <td className="py-3 px-4 text-text-muted">{r.weakestPillar}</td>
                  <td className="py-3 px-4 text-text-muted">{r.utmSource || "—"}</td>
                  <td className="py-3 px-4 text-text-muted max-w-xs truncate" title={r.feedback ?? ""}>
                    {r.feedback || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/results/${r.id}`} className="text-brand-orange hover:underline">
                      view
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 px-4 text-center text-text-muted">
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
