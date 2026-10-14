# Hagwon AI Readiness Index

A 17-question quiz for hagwon directors (English and Korean) that scores AI
readiness across seven areas, emails a report, and logs the lead. Live at
https://ai-readiness.chekkiai.com, linked from chekkiai.com/schools.

## Setup
1. `npm install`
2. `npm run dev` runs at http://localhost:3000
3. `npm run check` runs the scoring checks

## Environment variables (Vercel)
| Variable | What it does |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Same service account JSON as chekki-ai. Submissions go to the `readiness_submissions` collection. Without it nothing is stored and `/results/[id]` and `/admin` have no data. |
| `RESEND_API_KEY` | Sends the report email and the lead notification. |
| `RESEND_FROM` | Sender, e.g. `Chekki AI <hello@chekkiai.com>`. Defaults to Resend's onboarding address. |
| `NEXT_PUBLIC_NOTIFY_EMAIL` | Where lead notifications go; also the reply-to and the "Book a meeting" mailto. Replaces the old `NOTIFY_EMAIL`, which still works as a fallback for now. |
| `NEXT_PUBLIC_BOOKING_URL` | Optional booking link. When set, "Book a meeting" goes here instead of a mailto. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4. Events: `quiz_start`, `quiz_complete`, `generate_lead`. |
| `ADMIN_PASSWORD` | Turns on `/admin` behind HTTP basic auth (any username). |

## Where things live
- Questions, pillars, and per-pillar copy: `lib/questions.ts`
- Scoring and bands: `lib/scoring.ts`
- The report (built the same way on the results page and in the API): `lib/report.ts`
- UI strings: `lib/strings.ts`
- Design tokens: `app/globals.css`, copied from chekki-ai's `tokens.css` / `DESIGN.md` ("The Kitchen Table"). Update both together.

The API only accepts answers and contact details and rebuilds the report on
the server, so nobody can POST their own text into an email or a permalink.

## Links
`?lang=ko` opens the quiz in Korean; without it the quiz follows a saved
choice, then the browser language. UTM parameters are recorded first-touch.

## Deploy
Push to GitHub and import in Vercel. It detects Next.js automatically.
