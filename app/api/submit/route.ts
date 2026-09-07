import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Set FIREBASE_SERVICE_ACCOUNT to the same service account JSON chekki-ai
// uses, plus RESEND_API_KEY and NOTIFY_EMAIL, to get submissions written to
// Firestore, a report emailed to the submitter, and a lead notification
// emailed to you.

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PillarResult = { name: string; raw: number; maxRaw: number; blurb: string | null };

function pillarRowsHtml(pillarResults: PillarResult[]): string {
  return pillarResults
    .map(
      (p) => `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #e4e4e7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td style="font-size: 14px; color: #1C2B22; font-weight: 600;">${escapeHtml(p.name)}</td>
                <td align="right" style="font-size: 14px; color: #71717a; font-weight: 400;">${p.raw}/${p.maxRaw}</td>
              </tr>
            </table>
            ${p.blurb ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #52525b; line-height: 1.5;">${escapeHtml(p.blurb)}</p>` : ""}
          </td>
        </tr>`
    )
    .join("");
}

async function sendEmail(resendKey: string, payload: Record<string, unknown>) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, hagwon, contact, email, score, band, weakestPillar, pillarResults } = body as {
    name: string; hagwon: string; contact: string; email: string;
    score: number; band: string; weakestPillar: string; pillarResults: PillarResult[];
  };

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await adminDb.collection("readiness_submissions").add({
      name,
      hagwon,
      contact,
      email,
      score,
      band,
      weakestPillar,
      createdAt: new Date().toISOString(),
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM ?? "Chekki AI <onboarding@resend.dev>";

  if (resendKey) {
    try {
      await sendEmail(resendKey, {
        from: fromAddress,
        to: [email],
        subject: `Your Hagwon AI Readiness report — ${score}/72 (${band})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <p style="font-size: 13px; color: #2F5233; margin: 0 0 8px 0;">Your Hagwon AI Readiness result</p>
            <p style="font-size: 40px; font-weight: 600; color: #1C2B22; margin: 0;">${score}<span style="font-size: 16px; color: #71717a;"> / 72</span></p>
            <h1 style="font-size: 22px; color: #1C2B22; margin: 12px 0 8px 0;">${escapeHtml(band)}</h1>
            <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
              Full breakdown by pillar below. Scores below 75% of max include a note on why that pillar matters.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              ${pillarRowsHtml(pillarResults)}
            </table>
            <p style="font-size: 13px; color: #a1a1aa; margin-top: 24px;">
              This is a quick gut-check based on patterns we see across hagwons, not a formal audit.
            </p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Failed to send report email", e);
    }

    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (notifyEmail) {
      try {
        await sendEmail(resendKey, {
          from: fromAddress,
          to: [notifyEmail],
          subject: `New readiness quiz lead: ${escapeHtml(hagwon || name || "Unknown")} — ${score}/72 (${band})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
              <p>New AI Readiness quiz submission.</p>
              <table style="border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Name</td><td>${escapeHtml(name)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Hagwon</td><td>${escapeHtml(hagwon)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Email</td><td>${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Contact</td><td>${escapeHtml(contact)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Score</td><td>${escapeHtml(String(score))}/72</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Band</td><td>${escapeHtml(band)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Weakest pillar</td><td>${escapeHtml(weakestPillar)}</td></tr>
              </table>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send notification email", e);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
