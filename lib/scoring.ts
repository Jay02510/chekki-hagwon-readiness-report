import { pillars, questions } from "./questions";
import type { Localized } from "./i18n";

export type Answers = Record<string, "A" | "B" | "C" | "D">;

export type Band = {
  name: Localized;
  min: number;
  max: number;
  intro: Localized;
  blurb: Localized;
};

// Range is 21-84: with 17 questions weighted (parentComm/safety/teaching at
// 1.5x, the rest at 1x), 21 is the lowest possible weighted total (every
// answer worth 1 point) and 84 the highest (every answer worth 4). Four
// equal 16-point bands split that range.
export const bands: Band[] = [
  { name: { en: "Traditional Hagwon", ko: "전통적인 학원" }, min: 21, max: 36,
    intro: {
      en: "This is where most hagwons start out — nothing here is unusual, and there's a clear, specific path to close the gap below.",
      ko: "대부분의 학원이 이 단계에서 시작합니다. 특별히 이상한 결과가 아니며, 아래에 격차를 좁힐 수 있는 명확하고 구체적인 방법을 안내해 드립니다.",
    },
    blurb: {
      en: "Most work is manual or paper-based. The smallest changes will save the most time here, since almost nothing is automated yet.",
      ko: "대부분의 업무가 수기로 처리되고 있습니다. 아직 자동화된 부분이 거의 없기 때문에, 작은 변화만으로도 가장 큰 시간 절약 효과를 볼 수 있는 단계입니다.",
    } },
  { name: { en: "Digitizing", ko: "디지털 전환 중" }, min: 37, max: 52,
    intro: {
      en: "You've already got real pieces in place — most of what's left is connecting them, not starting from scratch.",
      ko: "이미 실질적인 기반을 갖추고 계십니다. 남은 과제는 처음부터 새로 시작하는 것이 아니라, 있는 것들을 서로 연결하는 일입니다.",
    },
    blurb: {
      en: "Spreadsheets and standalone tools exist but don't talk to each other — likely manual double-entry costing more staff time than anyone's tracking.",
      ko: "스프레드시트와 개별 도구들은 사용하고 있지만 서로 연동되지 않아, 수작업으로 이중 입력하는 데 드는 시간이 생각보다 많을 가능성이 큽니다.",
    } },
  { name: { en: "Tech-Enabled", ko: "시스템 활용 학원" }, min: 53, max: 68,
    intro: {
      en: "Solid result — you're ahead of most hagwons we see. What's left is connecting what you have, not rebuilding it.",
      ko: "좋은 결과입니다. 대부분의 학원보다 앞서 있는 상태입니다. 남은 과제는 다시 만드는 것이 아니라 이미 갖춘 것들을 연결하는 일입니다.",
    },
    blurb: {
      en: "Dedicated systems cover most core functions. The opportunity now is connecting them and adding personalization at scale.",
      ko: "핵심 업무 대부분이 전용 시스템으로 관리되고 있습니다. 이제는 이 시스템들을 서로 연결하고, 학생별 맞춤화를 대규모로 적용할 차례입니다.",
    } },
  { name: { en: "AI-Ready", ko: "AI 준비 완료" }, min: 69, max: 84,
    intro: {
      en: "Congratulations — this is a genuinely strong result, well ahead of the vast majority of hagwons we see.",
      ko: "축하드립니다. 매우 우수한 결과이며, 대부분의 학원보다 훨씬 앞서 있는 상태입니다.",
    },
    blurb: {
      en: "Data flows automatically, personalization is standard, staff already use AI day to day. The opportunity shifts to using this as a visible differentiator with parents.",
      ko: "데이터가 자동으로 흐르고, 맞춤형 학습이 기본이며, 직원들도 이미 AI를 일상적으로 활용하고 있습니다. 이제는 이를 학부모에게 보여줄 수 있는 확실한 차별점으로 활용할 단계입니다.",
    } },
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
  let weakestHasProduct = false;
  const pillarResults: PillarResult[] = [];

  for (const pillar of pillars) {
    const raw = byPillar[pillar.id];
    const maxRaw = questions.filter((q) => q.pillarId === pillar.id).length * 4;
    const ratio = raw / maxRaw;
    weightedTotal += raw * pillar.weight;
    pillarResults.push({ pillar, raw, maxRaw, ratio, isStrong: ratio >= STRONG_RATIO_THRESHOLD });
    // Ties are broken in two steps: first toward whichever pillar has a real
    // shipped product to point to (only parentComm today, via Chekki
    // Schools) since that's the stronger, more useful CTA either way; then
    // toward the higher-weight pillar; only then first-in-array.
    const hasProduct = pillar.id === "parentComm";
    const winsTie =
      ratio === lowestRatio &&
      ((hasProduct && !weakestHasProduct) ||
        (hasProduct === weakestHasProduct && pillar.weight > weakestWeight));
    if (ratio < lowestRatio || winsTie) {
      lowestRatio = ratio;
      weakestPillarId = pillar.id;
      weakestWeight = pillar.weight;
      weakestHasProduct = hasProduct;
    }
  }

  weightedTotal = Math.round(weightedTotal);

  const band = bands.find((b) => weightedTotal >= b.min && weightedTotal <= b.max) ?? bands[bands.length - 1];
  const weakestPillar = pillars.find((p) => p.id === weakestPillarId)!;

  return { weightedTotal, band, weakestPillar, byPillar, pillarResults };
}
