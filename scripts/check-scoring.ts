// Run with `npm run check`. Fails loudly if scoring, tie-breaks, or the
// report builder the API relies on break.
import assert from "node:assert/strict";
import { scoreAssessment, type Answers } from "../lib/scoring";
import { buildReport, isCompleteAnswers } from "../lib/report";
import { questions, pillars } from "../lib/questions";

const all = (label: "A" | "B" | "C" | "D") => Object.fromEntries(questions.map((q) => [q.id, label])) as Answers;

assert.equal(scoreAssessment(all("A")).weightedTotal, 21);
assert.equal(scoreAssessment(all("A")).band.id, "traditional");
assert.equal(scoreAssessment(all("D")).weightedTotal, 84);
assert.equal(scoreAssessment(all("D")).band.id, "aiReady");

// Every pillar tied: product pillars win, then weight, then array order.
assert.equal(scoreAssessment(all("B")).weakestPillar.id, "parentComm");
// parentComm strong, everything else tied: teaching (product, 1.5x) wins.
assert.equal(scoreAssessment({ ...all("B"), q1: "D", q2: "D" }).weakestPillar.id, "teaching");

const ko = buildReport(all("B"), "ko");
assert.equal(ko.band, "디지털 전환 중");
assert.equal(ko.bandId, "digitizing");
assert.equal(ko.pillarResults.length, pillars.length - 1);
assert.ok(ko.weakestNextStep.startsWith("이렇게 답변해 주셨죠"));

assert.ok(isCompleteAnswers(all("C")));
const { q5: _dropped, ...missing } = all("C");
assert.ok(!isCompleteAnswers(missing));
assert.ok(!isCompleteAnswers({ ...all("C"), q1: "E" }));
assert.ok(!isCompleteAnswers(null));

console.log("scoring checks passed");
