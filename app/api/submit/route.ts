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

type PillarResult = { name: string; raw: number; maxRaw: number; blurb: string | null; chekkiNote: string | null };

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
            ${p.chekkiNote ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #71717a; line-height: 1.5;">${escapeHtml(p.chekkiNote)}</p>` : ""}
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
  const { name, hagwon, contact, email, score, band, weakestPillar, pillarResults, lang } = body as {
    name: string; hagwon: string; contact: string; email: string;
    score: number; band: string; weakestPillar: string; pillarResults: PillarResult[];
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
      const copy = isKo
        ? {
            subject: `학원 AI 준비도 리포트 — ${score}/72 (${band})`,
            eyebrow: "AI 준비도 진단 결과",
            outOf: " / 72",
            intro: "영역별 상세 결과는 아래를 확인해주세요. 만점의 75% 미만인 영역에는 해당 영역이 왜 중요한지에 대한 설명을 함께 담았습니다.",
            fitIntro: "Chekki는 이미 7개 영역 중 3개 — 학부모 소통, 맞춤형 수업, 데이터 관리 — 를 제품으로 다루고 있습니다. 나머지는 대부분의 학원 소프트웨어도 다루지 않는 영역으로, 필요하시다면 함께 해결 방법을 논의할 수 있습니다.",
            footer: "학원들에게서 반복적으로 나타나는 패턴을 바탕으로 한 간단한 진단이며, 정식 컨설팅 리포트는 아닙니다.",
          }
        : {
            subject: `Your Hagwon AI Readiness report — ${score}/72 (${band})`,
            eyebrow: "Your Hagwon AI Readiness result",
            outOf: " / 72",
            intro: "Full breakdown by pillar below. Scores below 75% of max include a note on why that pillar matters.",
            fitIntro:
              "Chekki's product already covers three of these seven pillars today — parent communication, teaching personalization, and data. The rest are gaps most hagwon software doesn't touch either, and we're open to talking about closing them.",
            footer: "This is a quick gut-check based on patterns we see across hagwons, not a formal audit.",
          };

      await sendEmail(resendKey, {
        from: fromAddress,
        to: [email],
        subject: copy.subject,
        html: `
          <div style="font-family: 'Bricolage Grotesque', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
            <p style="font-size: 20px; font-weight: 900; margin: 0 0 16px 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></p>
            <p style="font-size: 13px; color: #f97316; margin: 0 0 8px 0;">${copy.eyebrow}</p>
            <p style="font-size: 40px; font-weight: 900; color: #ffffff; margin: 0;">${score}<span style="font-size: 16px; font-weight: 400; color: #a1a1aa;">${copy.outOf}</span></p>
            <h1 style="font-size: 22px; color: #ffffff; margin: 12px 0 8px 0;">${escapeHtml(band)}</h1>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 16px 0;">
              ${copy.intro}
            </p>
            <p style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin: 0 0 24px 0;">
              ${escapeHtml(copy.fitIntro)}
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              ${pillarRowsHtml(pillarResults)}
            </table>
            <p style="font-size: 13px; color: #71717a; margin-top: 24px;">
              ${copy.footer}
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
