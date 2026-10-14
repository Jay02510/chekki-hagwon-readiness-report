import { scoreAssessment, type Answers } from "./scoring";
import { questions, type Pillar } from "./questions";
import { strings } from "./strings";
import type { Lang, Localized } from "./i18n";

export type PillarRow = { name: string; raw: number; maxRaw: number; isStrong: boolean; blurb: string | null; nextStep: string | null };

// The report exactly as shown on screen, emailed, and stored. The API builds
// it from the answers alone, so a POST can't put its own text into a
// Chekki-branded email or a public /results/[id] page.
export type Report = {
  score: number;
  // Missing on reports submitted before band ids existed.
  bandId?: string;
  band: string;
  bandIntro: string;
  // Missing on reports submitted before these fields were stored.
  bandBlurb: string | null;
  safetyComm: { raw: number; maxRaw: number } | null;
  disclaimer: string;
  weakestPillar: string;
  weakestPillarId: string;
  weakestBlurb: string;
  weakestNextStep: string;
  weakestNextStep2: string;
  closingQuestion: string;
  // Every pillar except the weakest, which has its own section.
  pillarResults: PillarRow[];
  lang: Lang;
};

const LABELS = ["A", "B", "C", "D"];

export function isCompleteAnswers(value: unknown): value is Answers {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return questions.every((q) => LABELS.includes(a[q.id] as string));
}

// Only the teaching pillar maps to the parent-facing homework helper; every
// other pillar points at Chekki Schools, the director-facing product.
export function productHref(weakestPillarId: string): string {
  return weakestPillarId === "teaching" ? "https://chekkiai.com" : "https://chekkiai.com/schools";
}

export function buildReport(answers: Answers, lang: Lang): Report {
  const t = strings[lang];
  const L = (loc: Localized) => loc[lang];
  const result = scoreAssessment(answers);
  const weakest = result.weakestPillar;

  // Opens each pillar's next step with the director's own lowest-scoring
  // answer in that pillar, so the report reads as specific to them. A pillar
  // can span more than one problem (teaching covers leveled tracks and
  // homework), so nextStepByQuestion swaps in the step that fits the quote.
  function personalizedStepFor(pillar: Pillar): string {
    let worst: { questionId: string; text: string } | null = null;
    let worstPoints = Infinity;
    for (const q of questions) {
      if (q.pillarId !== pillar.id) continue;
      const opt = q.options.find((o) => o.label === answers[q.id]);
      if (opt && opt.points < worstPoints) {
        worstPoints = opt.points;
        worst = { questionId: q.id, text: L(opt.text) };
      }
    }
    if (!worst) return L(pillar.nextStep);
    const override = pillar.nextStepByQuestion?.[worst.questionId];
    return t.youMentioned(worst.text) + L(override ?? pillar.nextStep);
  }

  // The landing page leads with communication & safety, so the report always
  // answers that first — as one part of the overall score, not the whole of it.
  const safetyComm = result.pillarResults
    .filter((p) => p.pillar.id === "parentComm" || p.pillar.id === "safety")
    .reduce((acc, p) => ({ raw: acc.raw + p.raw, maxRaw: acc.maxRaw + p.maxRaw }), { raw: 0, maxRaw: 0 });

  const closingQuestion =
    weakest.id === "parentComm"
      ? t.closingSchools(L(weakest.name))
      : weakest.id === "teaching"
      ? t.closingHomework
      : t.closingOther(L(weakest.name));

  return {
    score: result.weightedTotal,
    bandId: result.band.id,
    band: L(result.band.name),
    bandIntro: L(result.band.intro),
    bandBlurb: L(result.band.blurb),
    safetyComm,
    disclaimer: t.disclaimer,
    weakestPillar: L(weakest.name),
    weakestPillarId: weakest.id,
    weakestBlurb: L(weakest.weakestBlurb),
    weakestNextStep: personalizedStepFor(weakest),
    weakestNextStep2: L(weakest.nextStep2),
    closingQuestion,
    pillarResults: result.pillarResults
      .filter((p) => p.pillar.id !== weakest.id)
      .map((p) => ({
        name: L(p.pillar.name),
        raw: p.raw,
        maxRaw: p.maxRaw,
        isStrong: p.isStrong,
        blurb: p.isStrong ? null : L(p.pillar.weakestBlurb),
        nextStep: p.isStrong ? null : personalizedStepFor(p.pillar),
      })),
    lang,
  };
}
