// Pulls readiness_submissions from Firestore and prints score distribution +
// weakest-pillar frequency, so band cutoffs (lib/scoring.ts) can eventually
// be recut off real data instead of an even split of the 18-72 range.
//
// Usage: FIREBASE_SERVICE_ACCOUNT='<service account json>' node scripts/analyze-submissions.mjs
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT before running this script.");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
const db = getFirestore();

const snap = await db.collection("readiness_submissions").get();
const rows = snap.docs.map((d) => d.data());

if (rows.length === 0) {
  console.log("No submissions yet.");
  process.exit(0);
}

const scores = rows.map((r) => r.score).sort((a, b) => a - b);
const quartile = (p) => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))];

console.log(`Submissions: ${scores.length}`);
console.log(`Min / P25 / Median / P75 / Max: ${scores[0]} / ${quartile(0.25)} / ${quartile(0.5)} / ${quartile(0.75)} / ${scores[scores.length - 1]}`);

const byBand = {};
for (const r of rows) byBand[r.band] = (byBand[r.band] ?? 0) + 1;
console.log("\nBy band:");
for (const [band, count] of Object.entries(byBand)) console.log(`  ${band}: ${count}`);

const byWeakest = {};
for (const r of rows) byWeakest[r.weakestPillar] = (byWeakest[r.weakestPillar] ?? 0) + 1;
console.log("\nWeakest pillar frequency:");
for (const [pillar, count] of Object.entries(byWeakest)) console.log(`  ${pillar}: ${count}`);
