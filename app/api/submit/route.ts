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

type PillarResult = { name: string; raw: number; maxRaw: number; blurb: string | null; nextStep: string | null };

function pillarRowsHtml(pillarResults: PillarResult[]): string {
  return pillarResults
    .map(
      (p) => `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #27272a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td style="font-size: 14px; color: #f4f4f5; font-weight: 600;">${escapeHtml(p.name)}</td>
                <td align="right" style="font-size: 14px; color: #a1a1aa; font-weight: 400;">${p.raw}/${p.maxRaw}</td>
              </tr>
            </table>
            ${p.blurb ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #d4d4d8; line-height: 1.5;">${escapeHtml(p.blurb)}</p>` : ""}
            ${p.nextStep ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #f97316; line-height: 1.5;"><strong>${escapeHtml(p.nextStep)}</strong></p>` : ""}
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
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: "Too many submissions — try again later." }, { status: 429 });
  }

  const body = await req.json();
  const {
    name, hagwon, contact, email, feedback, score, band, bandIntro,
    weakestPillar, weakestPillarId, weakestBlurb, weakestNextStep, weakestNextStep2,
    closingQuestion, disclaimer, pillarResults, lang,
  } = body as {
    name: string; hagwon: string; contact: string; email: string; feedback?: string;
    score: number; band: string; bandIntro: string;
    weakestPillar: string; weakestPillarId: string; weakestBlurb: string; weakestNextStep: string; weakestNextStep2: string;
    closingQuestion: string; disclaimer: string; pillarResults: PillarResult[];
    lang?: "en" | "ko";
  };
  const isKo = lang === "ko";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await adminDb.collection("readiness_submissions").add({
      name,
      hagwon,
      contact,
      email,
      feedback: feedback || null,
      score,
      band,
      weakestPillar,
      createdAt: new Date().toISOString(),
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM ?? "Chekki AI <onboarding@resend.dev>";

  if (resendKey) {
    const notifyEmail = process.env.NOTIFY_EMAIL;
    try {
      const copy = isKo
        ? {
            subject: `학원 AI 준비도 리포트 — ${score}/84 (${band})`,
            eyebrow: "AI 준비도 진단 결과",
            outOf: " / 84",
            weakestLabel: "가장 먼저 살펴볼 영역",
            allPillarsLabel: "영역별 전체 결과",
            ctaSchools: "Chekki Schools 살펴보기",
            ctaBook: "15분 상담 예약하기",
            ctaAudit: "심층 진단 요청하기",
          }
        : {
            subject: `Your Hagwon AI Readiness report — ${score}/84 (${band})`,
            eyebrow: "Your Hagwon AI Readiness result",
            outOf: " / 84",
            weakestLabel: "Where to look first",
            allPillarsLabel: "Full breakdown by pillar",
            ctaSchools: "See how Chekki Schools works",
            ctaBook: "Book a 15-minute call",
            ctaAudit: "Request a deeper audit",
          };

      // Chekki Schools is the only shipped product today — only pitch it when
      // Parent Communication & Reporting is the actual weakest pillar. Every
      // other pillar routes to a booking link (or a mailto fallback if no
      // booking link is configured yet) instead of a product that doesn't
      // exist for that pillar yet.
      const isSchoolsFit = weakestPillarId === "parentComm";
      const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
      const replyTarget = notifyEmail || fromAddress.replace(/^.*<(.+)>$/, "$1");
      const mailtoAudit = `mailto:${replyTarget}?subject=${encodeURIComponent(
        `${copy.ctaAudit} — ${hagwon || name || email}`
      )}&body=${encodeURIComponent(
        isKo
          ? `안녕하세요, AI 준비도 진단 결과(${score}/84)를 확인했습니다. 개선점을 자세히 짚어보는 심층 진단을 요청하고 싶습니다.`
          : `Hi, following my AI Readiness result (${score}/84), I'd like to set up a deeper audit to identify areas of improvement.`
      )}`;

      const ctaHtml = isSchoolsFit
        ? `<a href="https://chekkiai.com/schools" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaSchools}</a>`
        : bookingUrl
        ? `<a href="${escapeHtml(bookingUrl)}" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaBook}</a>`
        : notifyEmail
        ? `<a href="${mailtoAudit}" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaAudit}</a>`
        : "";

      await sendEmail(resendKey, {
        from: fromAddress,
        to: [email],
        ...(notifyEmail ? { reply_to: notifyEmail } : {}),
        subject: copy.subject,
        html: `
          <div style="font-family: 'Bricolage Grotesque', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
            <p style="font-size: 20px; font-weight: 900; margin: 0 0 16px 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></p>
            <p style="font-size: 13px; color: #f97316; margin: 0 0 8px 0;">${copy.eyebrow}</p>
            <p style="font-size: 40px; font-weight: 900; color: #ffffff; margin: 0;">${score}<span style="font-size: 16px; font-weight: 400; color: #a1a1aa;">${copy.outOf}</span></p>
            <h1 style="font-size: 22px; color: #ffffff; margin: 12px 0 8px 0;">${escapeHtml(band)}</h1>
            <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin: 0 0 10px 0;">
              ${escapeHtml(bandIntro)}
            </p>
            <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 0 0 24px 0;">
              ${escapeHtml(disclaimer)}
            </p>
            <p style="font-size: 13px; color: #f97316; margin: 0 0 8px 0; font-weight: 600;">${copy.weakestLabel}</p>
            <h2 style="font-size: 18px; color: #ffffff; margin: 0 0 8px 0;">${escapeHtml(weakestPillar)}</h2>
            <p style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin: 0 0 10px 0;">${escapeHtml(weakestBlurb)}</p>
            <p style="font-size: 13px; color: #f97316; line-height: 1.6; margin: 0;"><strong>${escapeHtml(weakestNextStep)}</strong></p>
            <p style="font-size: 13px; color: #f97316; line-height: 1.6; margin: 6px 0 24px 0;"><strong>${escapeHtml(weakestNextStep2)}</strong></p>
            <p style="font-size: 13px; color: #f97316; margin: 0 0 8px 0; font-weight: 600;">${copy.allPillarsLabel}</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${pillarRowsHtml(pillarResults)}
            </table>
            <p style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-top: 24px;">
              ${escapeHtml(closingQuestion)}
            </p>
            ${ctaHtml ? `<div style="margin-top: 14px;">${ctaHtml}</div>` : ""}
          </div>
        `,
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

  return NextResponse.json({ ok: true });
}
