import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { strings } from "@/lib/strings";
import { questions } from "@/lib/questions";
import type { Answers } from "@/lib/scoring";
import { buildReport, isCompleteAnswers, productHref, type PillarRow } from "@/lib/report";

// Set FIREBASE_SERVICE_ACCOUNT to the same service account JSON chekki-ai
// uses, plus RESEND_API_KEY and NEXT_PUBLIC_NOTIFY_EMAIL, to get submissions
// written to Firestore, a report emailed to the submitter, and a lead
// notification emailed to you.

// Sliding-window limiter, same fallback chekki-ai's api/_lib/rateLimit.ts
// uses when no Redis env vars are set — in-memory, so it resets per
// serverless cold start. Fine for this endpoint's traffic; swap in the
// Upstash-backed version from chekki-ai if this ever needs to survive
// cold starts / span instances.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const timestamps = (submissionsByIp.get(ip) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT) {
    submissionsByIp.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return false;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

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

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Chekki's warm tokens (chekki-ai DESIGN.md), light only — email clients
// can't be trusted with dark-mode CSS.
const C = {
  ground: "#fbf6ee",
  surface: "#ffffff",
  rule: "#ebdfcf",
  soft: "#fdebd8",
  ink: "#2b211a",
  ink2: "#5b4b3f",
  ink3: "#76665a",
  line: "#ef7c1c",
  lineInk: "#a84d06",
  right: "#1b7a43",
};
const FONT = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Single-level rows (no table nested inside a table cell) — Gmail's
// heuristic for auto-collapsing "quoted content" misfires on tables nested
// a third level deep, silently hiding whole sections behind a "..." toggle.
function pillarRowsHtml(pillarResults: PillarRow[], strongNote: string): string {
  const note = (body: string, color: string, padding: string, bold = false) =>
    `<tr><td colspan="2" style="padding: ${padding};"><p style="margin: 0; font-size: 13px; color: ${color}; line-height: 1.5;${bold ? " font-weight: 600;" : ""}">${escapeHtml(body)}</p></td></tr>`;
  return pillarResults
    .map((p) => {
      const notes = p.isStrong
        ? note(strongNote, C.right, "2px 0 10px 0", true)
        : (p.blurb ? note(p.blurb, C.ink2, "2px 0 0 0") : "") + (p.nextStep ? note(p.nextStep, C.lineInk, "4px 0 10px 0", true) : "");
      return `
        <tr>
          <td style="padding: 10px 0 0 0; border-top: 1px solid ${C.rule}; font-size: 14px; color: ${C.ink}; font-weight: 700;">${escapeHtml(p.name)}</td>
          <td align="right" style="padding: 10px 0 0 0; border-top: 1px solid ${C.rule}; font-size: 14px; color: ${C.ink2};">${p.raw}/${p.maxRaw}</td>
        </tr>
        ${notes}`;
    })
    .join("");
}

async function sendEmail(resendKey: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: "Too many submissions — try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = text(body.email, 254);
  const name = text(body.name, 100);
  const hagwon = text(body.hagwon, 100);
  const contact = text(body.contact, 100);
  const feedback = text(body.feedback, 2000);
  const lang = body.lang === "ko" ? "ko" : "en";
  const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (!isCompleteAnswers(body.answers)) {
    return NextResponse.json({ ok: false, error: "Every question needs an answer." }, { status: 400 });
  }
  // Keep only real question ids, so nothing else rides along into Firestore.
  const raw = body.answers;
  const answers = Object.fromEntries(questions.map((q) => [q.id, raw[q.id]])) as Answers;
  const report = buildReport(answers, lang);

  // The full report snapshot is stored alongside the lead fields so
  // /results/[id] can render it back later without the visitor's browser.
  let reportId: string | null = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const docRef = await adminDb.collection("readiness_submissions").add({
        ...report,
        answers,
        name,
        hagwon,
        contact,
        email,
        feedback: feedback || null,
        utmSource: text(utm.source, 100) || null,
        utmMedium: text(utm.medium, 100) || null,
        utmCampaign: text(utm.campaign, 100) || null,
        createdAt: new Date().toISOString(),
      });
      reportId = docRef.id;
    } catch (e) {
      console.error("Failed to save submission", e);
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM ?? "Chekki AI <onboarding@resend.dev>";
  // NOTIFY_EMAIL is the old server-only name, kept so existing deploys keep
  // getting lead emails until the env var is renamed.
  const notifyEmail = process.env.NEXT_PUBLIC_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL;
  let emailed = false;

  if (resendKey) {
    try {
      // Labels come from the same strings as the web results page so the
      // email and the site can't drift apart.
      const t = strings[lang];
      const subject = lang === "ko"
        ? `학원 AI 준비도 리포트 — ${report.score}/84 (${report.band})`
        : `Your Hagwon AI Readiness report — ${report.score}/84 (${report.band})`;
      const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
      const mailtoBook = notifyEmail
        ? `mailto:${notifyEmail}?subject=${encodeURIComponent(`${t.ctaBook} — ${hagwon || name || email}`)}&body=${encodeURIComponent(t.ctaBookBody(report.score))}`
        : null;
      const bookHref = bookingUrl ?? mailtoBook;

      const label = (s: string) => `<p style="font-size: 13px; color: ${C.ink3}; margin: 0 0 8px 0; font-weight: 700;">${escapeHtml(s)}</p>`;
      const button = (href: string, body: string, caption: string, primary: boolean) =>
        `<div style="display: inline-block; margin: 0 16px 12px 0; vertical-align: top;"><a href="${escapeHtml(href)}" style="display: inline-block; background-color: ${primary ? C.line : C.surface}; color: ${C.ink}; font-size: 15px; font-weight: 800; text-decoration: none; padding: 13px 22px; border-radius: 14px;${primary ? "" : ` border: 1px solid ${C.rule};`}">${escapeHtml(body)}</a><p style="font-size: 13px; color: ${C.ink3}; margin: 6px 0 0 0;">${escapeHtml(caption)}</p></div>`;
      const ctaHtml =
        button(productHref(report.weakestPillarId), t.ctaTry, t.ctaTryCaption, true) +
        (bookHref ? button(bookHref, t.ctaBook, t.ctaBookCaption(report.weakestPillar), false) : "");
      const safetyCommHtml = report.safetyComm
        ? `<table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 6px 0;"><tr>
              <td style="font-size: 17px; font-weight: 800; color: ${C.ink};">${escapeHtml(t.safetyCommLabel)}</td>
              <td align="right" style="font-size: 14px; color: ${C.ink2};">${report.safetyComm.raw}/${report.safetyComm.maxRaw}</td>
            </tr></table>
            <p style="font-size: 14px; color: ${C.ink2}; line-height: 1.6; margin: 0 0 24px 0;">${escapeHtml(t.safetyCommNote)}</p>`
        : "";
      const permalinkHtml = reportId
        ? `<p style="font-size: 13px; margin-top: 24px;"><a href="${req.nextUrl.origin}/results/${reportId}" style="color: ${C.lineInk};">${lang === "ko" ? "이 리포트 온라인으로 보기" : "View this report online"}</a></p>`
        : "";

      await sendEmail(resendKey, {
        from: fromAddress,
        to: [email],
        ...(notifyEmail ? { reply_to: notifyEmail } : {}),
        subject,
        html: `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${C.ground};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.ground}" style="background-color: ${C.ground};">
<tr><td align="center" style="padding: 24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${C.surface}" style="max-width: 600px; width: 100%; background-color: ${C.surface}; border: 1px solid ${C.rule}; border-radius: 14px;">
<tr><td style="font-family: ${FONT}; padding: 28px 24px; color: ${C.ink}; word-break: keep-all;">
            <p style="font-size: 20px; font-weight: 800; margin: 0 0 20px 0; color: ${C.ink};">Chekki<span style="color: ${C.lineInk};">ai</span></p>
            <p style="font-size: 13px; font-weight: 700; color: ${C.lineInk}; margin: 0 0 8px 0;">${escapeHtml(t.yourResult)}</p>
            <p style="font-size: 44px; font-weight: 800; color: ${C.ink}; margin: 0; letter-spacing: -0.02em;">${report.score}<span style="font-size: 16px; font-weight: 600; color: ${C.ink3}; letter-spacing: 0;"> / 84</span></p>
            <h1 style="font-size: 24px; font-weight: 800; color: ${C.ink}; margin: 12px 0 8px 0; letter-spacing: -0.02em;">${escapeHtml(report.band)}</h1>
            <p style="font-size: 15px; color: ${C.ink}; line-height: 1.6; margin: 0 0 10px 0;">${escapeHtml(report.bandIntro)}</p>
            ${report.bandBlurb ? `<p style="font-size: 15px; color: ${C.ink2}; line-height: 1.6; margin: 0 0 10px 0;">${escapeHtml(report.bandBlurb)}</p>` : ""}
            <p style="font-size: 13px; color: ${C.ink3}; line-height: 1.5; margin: 0 0 24px 0;">${escapeHtml(report.disclaimer)}</p>
            ${safetyCommHtml}
            ${label(t.weakestPillarLabel)}
            <h2 style="font-size: 19px; font-weight: 800; color: ${C.ink}; margin: 0 0 8px 0;">${escapeHtml(report.weakestPillar)}</h2>
            <p style="font-size: 14px; color: ${C.ink2}; line-height: 1.6; margin: 0 0 12px 0;">${escapeHtml(report.weakestBlurb)}</p>
            <div style="background-color: ${C.soft}; border-radius: 14px; padding: 12px 16px; margin: 0 0 24px 0;">
              <p style="font-size: 14px; color: ${C.ink}; line-height: 1.6; margin: 0; font-weight: 600;">1. ${escapeHtml(report.weakestNextStep)}</p>
              <p style="font-size: 14px; color: ${C.ink}; line-height: 1.6; margin: 8px 0 0 0; font-weight: 600;">2. ${escapeHtml(report.weakestNextStep2)}</p>
            </div>
            ${label(t.allPillars)}
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              ${pillarRowsHtml(report.pillarResults, t.strongNote)}
            </table>
            <p style="font-size: 14px; color: ${C.ink2}; line-height: 1.6; margin: 24px 0 14px 0;">${escapeHtml(report.closingQuestion)}</p>
            <div>${ctaHtml}</div>
            ${permalinkHtml}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
      });
      emailed = true;
    } catch (e) {
      console.error("Failed to send report email", e);
    }

    if (notifyEmail) {
      try {
        const row = (k: string, v: string) =>
          `<tr><td style="padding: 4px 12px 4px 0; color: #76665a;">${k}</td><td>${escapeHtml(v)}</td></tr>`;
        await sendEmail(resendKey, {
          from: fromAddress,
          to: [notifyEmail],
          // Plain-text header — no HTML escaping here.
          subject: `New readiness quiz lead: ${hagwon || name || "Unknown"} — ${report.score}/84 (${report.band})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
              <p>New AI Readiness quiz submission.</p>
              <table style="border-collapse: collapse; font-size: 14px;">
                ${row("Name", name)}${row("Hagwon", hagwon)}${row("Email", email)}${row("Contact", contact)}
                ${row("Score", `${report.score}/84`)}${row("Band", report.band)}${row("Weakest pillar", report.weakestPillar)}
              </table>
              ${feedback ? `<p style="margin-top: 16px; font-size: 14px;"><strong>Feedback:</strong> ${escapeHtml(feedback)}</p>` : ""}
              ${reportId ? `<p><a href="${req.nextUrl.origin}/results/${reportId}">View report</a></p>` : ""}
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send notification email", e);
      }
    }
  }

  // Nothing kept and nothing sent — tell the visitor instead of thanking them.
  if (!reportId && !emailed) {
    return NextResponse.json({ ok: false, error: "Couldn't save or send the report." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: reportId, emailed });
}
