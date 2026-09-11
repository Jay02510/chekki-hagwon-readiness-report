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
  const days = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);

  return (
    <div>
      <p className="font-display font-black text-2xl text-text-main mb-6">Submissions ({rows.length})</p>

      {rows.length > 0 && (
        <div className="mb-8 text-sm text-text-main/80 space-y-1">
          <p>
            Min / P25 / Median / P75 / Max: {scores[0]} / {quartile(scores, 0.25)} / {quartile(scores, 0.5)} /{" "}
            {quartile(scores, 0.75)} / {scores[scores.length - 1]}
          </p>
          <p>By band: {Object.entries(byBand).map(([b, c]) => `${b} (${c})`).join(", ")}</p>
          <p>Weakest pillar: {Object.entries(byWeakest).map(([p, c]) => `${p} (${c})`).join(", ")}</p>
          <p>By language: {Object.entries(byLang).map(([l, c]) => `${l} (${c})`).join(", ")}</p>
          <p>By UTM source: {Object.entries(bySource).map(([s, c]) => `${s} (${c})`).join(", ")}</p>
          <p>Last 14 days: {days.map(([d, c]) => `${d} (${c})`).join(", ")}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-text-muted">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Hagwon</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2 pr-4">Lang</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Band</th>
              <th className="py-2 pr-4">Weakest</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Feedback</th>
              <th className="py-2">Report</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-brand-border/50 text-text-main">
                <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{r.hagwon || r.name}</td>
                <td className="py-2 pr-4">{r.email}</td>
                <td className="py-2 pr-4">{r.contact}</td>
                <td className="py-2 pr-4">{r.lang || "en"}</td>
                <td className="py-2 pr-4">{r.score}/84</td>
                <td className="py-2 pr-4">{r.band}</td>
                <td className="py-2 pr-4">{r.weakestPillar}</td>
                <td className="py-2 pr-4">{r.utmSource || "—"}</td>
                <td className="py-2 pr-4 max-w-xs truncate" title={r.feedback ?? ""}>{r.feedback || "—"}</td>
                <td className="py-2">
                  <Link href={`/results/${r.id}`} className="text-brand-orange hover:underline">
                    view
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
