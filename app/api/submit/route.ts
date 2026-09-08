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
      const weakestPillarSafe = escapeHtml(weakestPillar);
      const copy = isKo
        ? {
            subject: `학원 AI 준비도 리포트 — ${score}/84 (${band})`,
            eyebrow: "AI 준비도 진단 결과",
            outOf: " / 84",
            weakestLabel: "가장 먼저 살펴볼 영역",
            allPillarsLabel: "영역별 전체 결과",
            ctaSchools: "Chekki Schools 살펴보기",
            ctaPartnership: "파트너십 알아보기",
            ctaProductCaption: "Chekki가 실제로 무엇을 하는지 확인해보세요",
            ctaBook: `${weakestPillarSafe} 상담 예약하기`,
            ctaBookCaption: "15분, 이 영역 하나에 집중한 상담입니다",
          }
        : {
            subject: `Your Hagwon AI Readiness report — ${score}/84 (${band})`,
            eyebrow: "Your Hagwon AI Readiness result",
            outOf: " / 84",
            weakestLabel: "Where to look first",
            allPillarsLabel: "Full breakdown by pillar",
            ctaSchools: "See how Chekki Schools works",
            ctaPartnership: "Explore a partnership",
            ctaProductCaption: "See what Chekki actually does",
            ctaBook: `Discuss your ${weakestPillarSafe} gap`,
            ctaBookCaption: "15 minutes, focused on this one gap",
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
      const productLabel = isHomeworkFit ? copy.ctaPartnership : copy.ctaSchools;
      const productBtnHtml = `<div style="display: inline-block; margin-right: 24px;"><a href="${productHref}" style="display: inline-block; background-color: #f97316; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${productLabel}</a><p style="font-size: 11px; color: #71717a; margin: 6px 0 0 0;">${copy.ctaProductCaption}</p></div>`;
      const bookHref = bookingUrl ? escapeHtml(bookingUrl) : notifyEmail ? mailtoBook : null;
      const bookBtnHtml = bookHref
        ? `<div style="display: inline-block;"><a href="${bookHref}" style="display: inline-block; border: 1px solid #f97316; color: #f97316; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 999px;">${copy.ctaBook}</a><p style="font-size: 11px; color: #71717a; margin: 6px 0 0 0;">${copy.ctaBookCaption}</p></div>`
        : "";
      const ctaHtml = productBtnHtml + bookBtnHtml;

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
