import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Set FIREBASE_SERVICE_ACCOUNT to the same service account JSON chekki-ai
// uses, plus RESEND_API_KEY and NOTIFY_EMAIL, to get submissions written to
// Firestore and an email per lead.

// Public, unauthenticated input goes straight into an HTML email below —
// must be escaped so a submitted value can't inject markup/links into an
// email that looks like it came from Chekki AI (same fix as chekki-ai's
// api/request-school-invoice.ts).
function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, hagwon, contact, score, band, weakestPillar } = body;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await adminDb.collection("readiness_submissions").add({
      name,
      hagwon,
      contact,
      score,
      band,
      weakestPillar,
      createdAt: new Date().toISOString(),
    });
  }

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
          from: process.env.RESEND_FROM ?? "Chekki AI <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `New readiness quiz lead: ${escapeHtml(hagwon || name || "Unknown")} — ${score}/72 (${band})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
              <p>New AI Readiness quiz submission.</p>
              <table style="border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Name</td><td>${escapeHtml(name)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Hagwon</td><td>${escapeHtml(hagwon)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Contact</td><td>${escapeHtml(contact)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Score</td><td>${escapeHtml(String(score))}/72</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Band</td><td>${escapeHtml(band)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Weakest pillar</td><td>${escapeHtml(weakestPillar)}</td></tr>
              </table>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Failed to send notification email", e);
    }
  }

  return NextResponse.json({ ok: true });
}
