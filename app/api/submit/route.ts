import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Set FIREBASE_SERVICE_ACCOUNT to the same service account JSON chekki-ai
// uses, plus RESEND_API_KEY and NOTIFY_EMAIL, to get submissions written to
// Firestore, a report emailed to the submitter, and a lead notification
// emailed to you.

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

type PillarResult = { name: string; raw: number; maxRaw: number; blurb: string | null; nextStep: string | null; isStrong: boolean };

// Single-level rows (no table nested inside a table cell) — Gmail's
// heuristic for auto-collapsing "quoted content" misfires on tables nested
// a third level deep, silently hiding whole sections behind a "..." toggle.
function pillarRowsHtml(pillarResults: PillarResult[], strongNote: string): string {
  return pillarResults
    .map((p) => {
      const noteHtml = p.isStrong
        ? `<tr><td colspan="2" style="padding: 2px 0 10px 0;"><p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">${escapeHtml(strongNote)}</p></td></tr>`
        : `${p.blurb ? `<tr><td colspan="2" style="padding: 2px 0 0 0;"><p style="margin: 0; font-size: 13px; color: #52525b; line-height: 1.5;">${escapeHtml(p.blurb)}</p></td></tr>` : ""}${
            p.nextStep
              ? `<tr><td colspan="2" style="padding: 4px 0 10px 0;"><p style="margin: 0; font-size: 13px; color: #c2410c; line-height: 1.5;"><strong>${escapeHtml(p.nextStep)}</strong></p></td></tr>`
              : ""
          }`;
      return `
        <tr>
          <td style="padding: 10px 0 0 0; border-top: 1px solid #e4e4e7; font-size: 14px; color: #18181b; font-weight: 600;">${escapeHtml(p.name)}</td>
          <td align="right" style="padding: 10px 0 0 0; border-top: 1px solid #e4e4e7; font-size: 14px; color: #71717a; font-weight: 400;">${p.raw}/${p.maxRaw}</td>
        </tr>
        ${noteHtml}`;
    })
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
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: "Too many submissions — try again later." }, { status: 429 });
  }

  const body = await req.json();
  const {
    name, hagwon, contact, email, feedback, score, band, bandIntro,
    weakestPillar, weakestPillarId, weakestBlurb, weakestNextStep, weakestNextStep2,
    closingQuestion, disclaimer, pillarResults, lang, utm,
  } = body as {
    name: string; hagwon: string; contact: string; email: string; feedback?: string;
    score: number; band: string; bandIntro: string;
    weakestPillar: string; weakestPillarId: string; weakestBlurb: string; weakestNextStep: string; weakestNextStep2: string;
    closingQuestion: string; disclaimer: string; pillarResults: PillarResult[];
    lang?: "en" | "ko";
    utm?: { source?: string; medium?: string; campaign?: string };
  };
  const isKo = lang === "ko";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }

  // Full report snapshot is stored alongside the lead fields so /results/[id]
  // can render the exact same report back later — a permalink, without
  // needing the visitor's own browser/localStorage.
  let reportId: string | null = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const docRef = await adminDb.collection("readiness_submissions").add({
      name,
      hagwon,
      contact,
      email,
      feedback: feedback || null,
      score,
      band,
      bandIntro,
      weakestPillar,
      weakestPillarId,
      weakestBlurb,
      weakestNextStep,
      weakestNextStep2,
      closingQuestion,
      disclaimer,
      pillarResults,
      lang: lang || "en",
      utmSource: utm?.source || null,
      utmMedium: utm?.medium || null,
      utmCampaign: utm?.campaign || null,
      createdAt: new Date().toISOString(),
    });
    reportId = docRef.id;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM ?? "Chekki AI <onboarding@resend.dev>";

  if (resendKey) {
    const notifyEmail = process.env.NOTIFY_EMAIL;
    try {
      const weakestPillarSafe = escapeHtml(weakestPillar);
      const copy = isKo
        ? {
            subject: `학원 AI 준비도 리포트 — ${score}/84 (${band})`,
            eyebrow: "AI 준비도 진단 결과",
            outOf: " / 84",
            weakestLabel: "가장 먼저 살펴볼 영역",
            allPillarsLabel: "영역별 전체 결과",
            strongNote: "탄탄합니다 — 지금은 다른 영역에 집중하셔도 좋습니다.",
            ctaTry: "Chekki 사용해보기",
            ctaTryCaption: "Chekki가 어떻게 도움이 되는지 확인해보세요",
            ctaBook: "미팅 예약하기",
            ctaBookCaption: `${weakestPillarSafe}에 대해 더 자세히 이야기해보아요`,
          }
        : {
            subject: `Your Hagwon AI Readiness report — ${score}/84 (${band})`,
            eyebrow: "Your Hagwon AI Readiness result",
            outOf: " / 84",
            weakestLabel: "Where to look first",
            allPillarsLabel: "Full breakdown by pillar",
            strongNote: "Solid — this one's already working, so focus your energy elsewhere first.",
            ctaTry: "Try Chekki",
            ctaTryCaption: "See how Chekki can help",
            ctaBook: "Book a meeting",
            ctaBookCaption: `Let's discuss your ${weakestPillarSafe} further`,
          };

      // Only the teaching pillar maps to the parent-facing homework helper,
      // pitched as a partnership since the director would be introducing it
      // to parents, not running it themselves. Every other pillar — including
      // parentComm — points at Chekki Schools, the director-facing product.
      const isHomeworkFit = weakestPillarId === "teaching";
      const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
      const replyTarget = notifyEmail || fromAddress.replace(/^.*<(.+)>$/, "$1");
      const mailtoBook = `mailto:${replyTarget}?subject=${encodeURIComponent(
        `${copy.ctaBook} — ${hagwon || name || email}`
      )}&body=${encodeURIComponent(
        isKo
          ? `안녕하세요, AI 준비도 진단 결과(${score}/84)를 확인했습니다. 가장 취약한 영역과 다음 단계에 대해 상담하고 싶습니다.`
          : `Hi, following my AI Readiness result (${score}/84), I'd like to set up a time to discuss my weakest pillar and next steps.`
      )}`;

      const productHref = isHomeworkFit ? "https://chekkiai.com" : "https://chekkiai.com/schools";
      const productBtnHtml = `<div style="display: inline-block; margin-right: 24px;"><a href="${productHref}" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaTry}</a><p style="font-size: 11px; color: #71717a; margin: 6px 0 0 0;">${copy.ctaTryCaption}</p></div>`;
      const bookHref = bookingUrl ? escapeHtml(bookingUrl) : notifyEmail ? mailtoBook : null;
      const bookBtnHtml = bookHref
        ? `<div style="display: inline-block;"><a href="${bookHref}" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaBook}</a><p style="font-size: 11px; color: #71717a; margin: 6px 0 0 0;">${copy.ctaBookCaption}</p></div>`
        : "";
      const ctaHtml = productBtnHtml + bookBtnHtml;

      await sendEmail(resendKey, {
        from: fromAddress,
        to: [email],
        ...(notifyEmail ? { reply_to: notifyEmail } : {}),
        subject: copy.subject,
        html: `<!DOCTYPE html>
<html lang="${isKo ? "ko" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${copy.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f5" style="background-color: #f4f4f5;">
<tr><td align="center" style="padding: 24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px;">
<tr><td style="font-family: 'Bricolage Grotesque', sans-serif; padding: 24px; color: #18181b;">
            <p style="font-size: 20px; font-weight: 900; margin: 0 0 16px 0; color: #18181b;">Chekki<span style="color: #f97316;">ai</span></p>
            <p style="font-size: 13px; color: #c2410c; margin: 0 0 8px 0;">${copy.eyebrow}</p>
            <p style="font-size: 40px; font-weight: 900; color: #18181b; margin: 0;">${score}<span style="font-size: 16px; font-weight: 400; color: #71717a;">${copy.outOf}</span></p>
            <h1 style="font-size: 22px; color: #18181b; margin: 12px 0 8px 0;">${escapeHtml(band)}</h1>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 10px 0;">
              ${escapeHtml(bandIntro)}
            </p>
            <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0 0 24px 0;">
              ${escapeHtml(disclaimer)}
            </p>
            <p style="font-size: 13px; color: #c2410c; margin: 0 0 8px 0; font-weight: 600;">${copy.weakestLabel}</p>
            <h2 style="font-size: 18px; color: #18181b; margin: 0 0 8px 0;">${escapeHtml(weakestPillar)}</h2>
            <p style="font-size: 13px; color: #3f3f46; line-height: 1.6; margin: 0 0 10px 0;">${escapeHtml(weakestBlurb)}</p>
            <p style="font-size: 13px; color: #c2410c; line-height: 1.6; margin: 0;"><strong>${escapeHtml(weakestNextStep)}</strong></p>
            <p style="font-size: 13px; color: #c2410c; line-height: 1.6; margin: 6px 0 24px 0;"><strong>${escapeHtml(weakestNextStep2)}</strong></p>
            <p style="font-size: 13px; color: #c2410c; margin: 0 0 8px 0; font-weight: 600;">${copy.allPillarsLabel}</p>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              ${pillarRowsHtml(pillarResults, copy.strongNote)}
            </table>
            <p style="font-size: 13px; color: #3f3f46; line-height: 1.6; margin-top: 24px;">
              ${escapeHtml(closingQuestion)}
            </p>
            ${ctaHtml ? `<div style="margin-top: 14px;">${ctaHtml}</div>` : ""}
${reportId ? `            <p style="font-size: 12px; margin-top: 24px;"><a href="https://ai-readiness.chekkiai.com/results/${reportId}" style="color: #71717a;">${isKo ? "이 리포트 온라인으로 보기" : "View this report online"}</a></p>` : ""}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
      });
    } catch (e) {
      console.error("Failed to send report email", e);
    }

    if (notifyEmail) {
      try {
        await sendEmail(resendKey, {
          from: fromAddress,
          to: [notifyEmail],
          subject: `New readiness quiz lead: ${escapeHtml(hagwon || name || "Unknown")} — ${score}/84 (${band})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
              <p>New AI Readiness quiz submission.</p>
              <table style="border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Name</td><td>${escapeHtml(name)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Hagwon</td><td>${escapeHtml(hagwon)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Email</td><td>${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Contact</td><td>${escapeHtml(contact)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Score</td><td>${escapeHtml(String(score))}/84</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Band</td><td>${escapeHtml(band)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #71717a;">Weakest pillar</td><td>${escapeHtml(weakestPillar)}</td></tr>
              </table>
              ${feedback ? `<p style="margin-top: 16px; font-size: 14px;"><strong>Feedback:</strong> ${escapeHtml(feedback)}</p>` : ""}
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send notification email", e);
      }
    }
  }

  return NextResponse.json({ ok: true, id: reportId });
}
