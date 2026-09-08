import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// One-off endpoint to delete smoke-test rows written during development.
// Delete this file after use — not meant to stay in the codebase.
const CLEANUP_KEY = "temp-cleanup-8f2c1a";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-cleanup-key") !== CLEANUP_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const snap = await adminDb.collection("readiness_submissions").get();
  const toDelete = snap.docs.filter((d) => String(d.data().name ?? "").startsWith("SMOKE TEST"));
  await Promise.all(toDelete.map((d) => d.ref.delete()));

  return NextResponse.json({ ok: true, deleted: toDelete.map((d) => d.id) });
}
