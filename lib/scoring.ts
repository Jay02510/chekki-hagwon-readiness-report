import { pillars, questions } from "./questions";

export type Answers = Record<string, "A" | "B" | "C" | "D">;

export type Band = {
  name: string;
  min: number;
  max: number;
  blurb: string;
};

export const bands: Band[] = [
  { name: "Traditional Hagwon", min: 18, max: 31,
    blurb: "Most work is manual or paper-based. The smallest changes will save the most time here, since almost nothing is automated yet." },
  { name: "Digitizing", min: 32, max: 45,
    blurb: "Spreadsheets and standalone tools exist but don't talk to each other — likely manual double-entry costing more staff time than anyone's tracking." },
  { name: "Tech-Enabled", min: 46, max: 59,
    blurb: "Dedicated systems cover most core functions. The opportunity now is connecting them and adding personalization at scale." },
  { name: "AI-Ready", min: 60, max: 72,
    blurb: "Data flows automatically, personalization is standard, staff already use AI day to day. The opportunity shifts to using this as a visible differentiator with parents." },
];

// Below this ratio (raw points / max possible points) a pillar is treated
// as weak/mid and shows its "why this matters" blurb on the report; at or
// above it, the pillar is doing fine and the blurb is skipped so the copy
// (written in a "this needs fixing" voice) doesn't read oddly next to a
// strong score.
const STRONG_RATIO_THRESHOLD = 0.75;

export type PillarResult = {
  pillar: (typeof pillars)[number];
  raw: number;
  maxRaw: number;
  ratio: number;
  isStrong: boolean;
};

export function scoreAssessment(answers: Answers) {
  const byPillar: Record<string, number> = {};

  for (const pillar of pillars) byPillar[pillar.id] = 0;

  for (const q of questions) {
    const chosen = answers[q.id];
    const option = q.options.find((o) => o.label === chosen);
    if (option) byPillar[q.pillarId] += option.points;
  }

  let weightedTotal = 0;
  let lowestRatio = Infinity;
  let weakestPillarId = pillars[0].id;
  let weakestWeight = -Infinity;
  const pillarResults: PillarResult[] = [];

  for (const pillar of pillars) {
    const raw = byPillar[pillar.id];
    const maxRaw = questions.filter((q) => q.pillarId === pillar.id).length * 4;
    const ratio = raw / maxRaw;
    weightedTotal += raw * pillar.weight;
    pillarResults.push({ pillar, raw, maxRaw, ratio, isStrong: ratio >= STRONG_RATIO_THRESHOLD });
    // Ties go to the higher-weight pillar (parentComm/safety) since those
    // are the ones worth surfacing for follow-up anyway — not just
    // whichever pillar happens to come first in the array.
    if (ratio < lowestRatio || (ratio === lowestRatio && pillar.weight > weakestWeight)) {
      lowestRatio = ratio;
      weakestPillarId = pillar.id;
      weakestWeight = pillar.weight;
    }
  }

  weightedTotal = Math.round(weightedTotal);

  const band = bands.find((b) => weightedTotal >= b.min && weightedTotal <= b.max) ?? bands[bands.length - 1];
  const weakestPillar = pillars.find((p) => p.id === weakestPillarId)!;

  return { weightedTotal, band, weakestPillar, byPillar, pillarResults };
}
