# NUMPA Web

The current product slice is a Next.js workspace for CSV inspection and explicit cleaning. It supports browser-only use without an account, plus optional Supabase accounts and private saved dataset copies.

## Run locally

```powershell
cd apps/web
npm ci
npm run dev
```

Open `http://localhost:3000`. The public homepage links to `/demo`, which runs without cloud configuration. Use `npm run lint` and `npm run build` to validate code changes.

## Enable accounts and private saved datasets

1. Use the development project [`numpa-v2-dev`](https://supabase.com/dashboard/project/xjkulfyetcvuuhxhuevp) (`xjkulfyetcvuuhxhuevp`). Confirm its region under **Project Settings → General**.
2. `apps/web/.env.local` is ignored by Git. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` there from **Project Settings → API Keys**; the Project URL is already configured as `https://xjkulfyetcvuuhxhuevp.supabase.co`. Do not put a secret/service-role key in this file.
3. Review and apply both ordered migrations to development: `../../supabase/migrations/20261023000100_saas_foundation.sql`, then `../../supabase/migrations/20261024000100_supabase_access_hardening.sql`. Preview with `npx --yes supabase@latest db push --dry-run` first. See [`docs/launch-setup.md`](../../docs/launch-setup.md) for exact steps and pending status.
4. In Supabase Auth URL Configuration, set the site URL to the app URL and allow `<app-url>/auth/callback`.
5. Configure SMTP/email delivery and verify signup and password reset email links.
6. Restart the dev server, create an account, then open `/app`.

Cloud saving is an explicit opt-in. The source CSV is stored in a private bucket; schema metadata is saved without sample cell values. Analysis and cleaning remain in the browser. The database creates one personal workspace at signup and enforces workspace membership and roles with RLS. The app requests the current workspace’s last 12 ready datasets and downloads private objects through the signed-in user session.

## Current capabilities

- CSV upload via file chooser or drag and drop, capped at 10 MB, 20,000 data rows, and 80 columns.
- Quoted values, escaped quotes, embedded line breaks, and UTF-8 BOM parsing.
- Dataset profile: field type heuristic, missing values, unique counts, exact duplicate rows, completeness, quality observations, and row preview.
- Safe cleaning preview for whitespace trimming and exact duplicate removal; apply changes explicitly to a working copy, reset, and export.
- Account signup, sign in, sign out, email confirmation callback, and password reset/update flows.
- Optional private source copy with SHA-256, schema summary, immutable version metadata, and saved dataset history; applied cleaning can be explicitly saved as a new immutable version.
- Security headers, server-side session refresh, server-side user check for `/app`, private storage, and workspace row policies.

## Product boundaries and launch gates

This is a working MVP foundation, not yet a launch-ready full NUMPA SaaS. The development project details are recorded, but remote migrations, Auth dashboard settings, SMTP, hosting, and production are not verified/configured. The publishable key still needs to be entered locally. Processing is browser-local; FastAPI endpoints, durable workers, job execution, Excel/PDF parsing, visualization workflows, task-specific ML readiness, model training/evaluation, report generation, billing, team invitations, deletion/retention automation, backups, monitoring, and operational runbooks are not implemented. Both SQL migrations must be applied and validated against development before enabling cloud accounts.

The browser upload size is deliberately bounded. Type inference is heuristic, and no displayed result is an ML-readiness score or a model-performance prediction. Cleaning changes the in-memory working copy first; a separate explicit action persists it as a new version when the dataset has a private workspace copy.

