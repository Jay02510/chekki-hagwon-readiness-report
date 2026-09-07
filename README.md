# Hagwon AI Readiness Index

## Setup
1. `npm install`
2. `npm run dev` — runs at http://localhost:3000

## Before deploying
- In Vercel project settings, add an environment variable `MAKE_WEBHOOK_URL`
  pointing to a Make.com webhook that logs submissions into your Airtable base.
- Update the metadata in `app/layout.tsx` (title/description) once you have
  a final name.

## Deploy
- Push this folder to a GitHub repo, then import it in Vercel — it will
  detect Next.js automatically. Or run `vercel` from this folder if you
  have the CLI installed.

## Korean version later
All question content lives in `lib/questions.ts`. To add Korean, duplicate
that file (e.g. `questions.ko.ts`) and swap it in based on locale — no
other file needs to change.
