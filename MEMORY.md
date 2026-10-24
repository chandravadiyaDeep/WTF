# NUMPA v2 — Project Memory

Short handoff record. Read this first when resuming; detailed product requirements remain in the linked architecture plans.

## Project

- Repository: `chandravadiyaDeep/WTF`; working branch: `docs/numpa-v2-architecture`.
- Product: explainable data workspace for profiling, cleaning, visualization, ML readiness, modeling, evaluation, and reporting.
- Current phase: usable CSV MVP with an in-progress SaaS foundation. It is not yet a production launch.
- Last updated: 2026-10-24 (Asia/Calcutta).

## Architecture and decisions

- Web: Next.js App Router, React, TypeScript.
- Intended service direction: FastAPI modular monolith plus worker; Supabase Auth/Postgres; private object storage; browser-local work when appropriate.
- Preserve source data; preview material cleaning changes; immutable versions and evidence; explicit consent before cloud transfer.
- Long jobs must be durable/idempotent. Billing must be server-authoritative. No pricing, billing, ML readiness score, or model-performance claim is implemented.
- The Supabase migration sets initial MVP limits: CSV only, 10 MiB, 20,000 rows, 80 columns. Revisit before production.

## Plans

| Plan | Scope | State |
|---|---|---|
| 1 | Product/service workflow | Architecture documented; MVP behavior now includes explicit cloud-save consent and evidence-first local profiling. |
| 2 | Database/storage | Architecture documented; initial Supabase schema, RLS, private bucket, immutable dataset versions, and upload/version RPCs added. Must apply and validate against a real Supabase project. |
| 3 | Backend | Architecture documented; FastAPI service and durable worker are not implemented. |
| 4 | Processing engine | Architecture documented; local CSV parser/profile/clean preview exists. Cloud jobs, advanced formats and ML engine are not implemented. |
| 5 | Frontend | Architecture documented; landing, demo/workspace dashboard, auth and reset routes, responsive styling are implemented in `apps/web`. |
| 6 | Security/reliability/scaling | Architecture documented; auth session handling, security headers, RLS and private storage policies are coded. Production controls and operational validation remain. |
| 7 | Delivery/testing/deployment | Not completed; CI now runs web lint/build, but deployment and production readiness are open. |

Index: [`docs/architecture/architecture-plans-index.md`](docs/architecture/architecture-plans-index.md)

## Current implementation

- Browser-only CSV upload/drag-drop, capped at 10 MiB/20k rows/80 columns; quoted CSV support, field profiling, missing/duplicate/completeness signals and preview.
- Whitespace trim and exact duplicate removal have explicit preview/apply; working copy can reset and export with formula-like cells guarded.
- Without Supabase configuration, `/demo` works locally and does not upload or persist the file.
- Optional Supabase auth: signup, login, email callback, password reset, signout; `/app` checks the current authenticated user server-side.
- User may opt into saving the source CSV to a private workspace bucket. Schema summary excludes sample values. Row-level policies scope workspace records; database RPCs create/fail versions and constrain object paths.
- Saved datasets can be listed/opened from private storage. Analysis remains local. Applied cleaning can be explicitly saved as an immutable version; the previous version remains unchanged.
- `apps/web/README.md` contains setup steps. `.env.example` is safe to copy; never commit `.env.local` or service-role secrets.

## Remaining before a real SaaS launch

1. Configure Supabase URL/key, auth redirect domain, SMTP; apply migration and exercise separate-user/workspace RLS/storage paths.
2. Implement and validate durable API/worker processing, job lifecycle, cancellation/retries and saved cleaned versions.
3. Add team/workspace management, account/data deletion and retention cleanup, quotas/abuse controls, backups/restore, monitoring and incident runbooks.
4. Implement supported additional formats, visualizations, task-specific readiness, model execution/evaluation and reports only from verified engine evidence.
5. Decide and implement billing/payment only after server-side quote, ledger, idempotency and refund controls are approved.
6. Choose hosting/domain, configure secrets and deploy; run production acceptance and security reviews.

## History

- 2026-10-23 — Started MVP by explicit user direction. Added local CSV profiling and cleaning. Later expanded with Supabase auth routes, personal workspace schema/RLS, private storage, opt-in cloud source saving and saved dataset history.
- 2026-10-24 — Hardened dataset persistence: version creation uses an atomic security-definer RPC; dataset creation and private object upload policies restrict client writes; added an upload-failure RPC; removed unrestricted metadata updates and direct deletion to avoid orphaning private objects. Added setup/boundary docs, a concise handoff update, and web lint/build CI. `npm run lint` and `npm run build` passed. No project credentials or deployment environment are available here.
- 2026-10-24 — Added explicit save-as-version for cleaned private datasets. The web app uploads the prepared CSV under the next version path, then calls the version RPC; the source and previous versions remain available. `npm run lint` and `npm run build` passed; local `/demo` returned HTTP 200. GitHub CI passed for commit `e4128365ea8a30182a816984414e6858be7ef375`.
- 2026-10-13 — Created this memory handoff and architecture direction record.
- 2026-10-12 — Connected repository WTF and branch `docs/numpa-v2-architecture`; documented Plans 1–6 and the supplied dark dashboard design reference.

## Memory maintenance

After each meaningful activity, add one concise dated entry with outcome, files/decisions changed and commit if available. Avoid routine tool calls, secrets, personal data and unverified claims. Update the remaining-work list when decisions or gates are resolved.
