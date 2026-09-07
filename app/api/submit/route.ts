import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Set POSTGRES_URL (auto-added when you attach Vercel Postgres to this project),
// plus RESEND_API_KEY and NOTIFY_EMAIL to get an email per submission.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, hagwon, contact, score, band, weakestPillar } = body;

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      name TEXT,
      hagwon TEXT,
      contact TEXT,
      score INTEGER,
      band TEXT,
      weakest_pillar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO submissions (name, hagwon, contact, score, band, weakest_pillar)
    VALUES (${name}, ${hagwon}, ${contact}, ${score}, ${band}, ${weakestPillar})
  `;

  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (resendKey && notifyEmail) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "Hagwon Readiness <onboarding@resend.dev>",
          to: notifyEmail,
          subject: `New submission: ${hagwon || name || "Unknown"} — ${score}/72 (${band})`,
          text: `Name: ${name}\nHagwon: ${hagwon}\nContact: ${contact}\nScore: ${score}/72\nBand: ${band}\nWeakest pillar: ${weakestPillar}`,
        }),
      });
    } catch (e) {
      console.error("Failed to send notification email", e);
    }
  }

  return NextResponse.json({ ok: true });
}
