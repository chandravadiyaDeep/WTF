# NUMPA v2 — Project Memory

Purpose: concise handoff record from project start to current state. Read this first when resuming. Detailed requirements remain in linked plans; this file records the decisions and progress that matter.

## Project

- Repository: chandravadiyaDeep/WTF
- Working branch: docs/numpa-v2-architecture
- Product: NUMPA v2, a data analysis and ML workflow: upload, understand, clean, visualize, assess ML readiness, train, evaluate, compare and report.
- Current phase: first MVP implementation slice. Browser-local CSV profiling/cleanup UI exists under apps/web; backend, database migrations, deployment, and identity are not implemented.
- Last updated: 2026-10-23 (Asia/Calcutta).

## Architecture direction

- Frontend: Next.js App Router, React and TypeScript.
- Backend: Python/FastAPI modular monolith with API and separate worker.
- Identity/data: Supabase Auth, workspace-scoped PostgreSQL and RLS.
- Files: private object storage, opaque keys, immutable dataset versions and lineage.
- Processing: browser-local when appropriate; explicit consent before cloud transfer; never silently switch local work to cloud.
- Long jobs: durable/idempotent status, safe retries/cancellation/cleanup.
- Product rules: preview and confirm material changes; preserve source; explain findings from engine evidence; prevent ML leakage.
- Billing: server owns pricing, quotes, reservations, payment verification and append-only token ledger. Paid launch waits for reviewed controls.
- Numeric limits, pricing, retention, recovery targets and provider choices remain undecided.

## Plans and state

| Plan | Scope | State and next work |
|---|---|---|
| 1 — Product and Service Workflow | End-to-end user journey; consent, explainability and recovery expectations. | Concept documented in 00-product-brief.md and 01-product-and-service-workflow.md. Review workflow and product decisions. |
| 2 — Database and Storage | Workspace/schema model, RLS, private object lifecycle, immutable versions, jobs, artifacts and ledger. | Draft for review. Decide browser persistence, retention/deletion, backups/recovery, workspace launch scope and billing policies before migrations. |
| 3 — Backend | FastAPI boundaries, auth, representative /v1 APIs, jobs, errors, upload and billing. | Draft for review. Finalize OpenAPI gaps, auth/database details, resource limits and payment provider before implementation. |
| 4 — Processing Engine | Ingestion, canonical data, browser/cloud routing, profiling, cleaning, evidence/charts, readiness, recommendations and ML evaluation. | Draft for review. Decide parsers/limits, PDF/OCR, readiness weights, model roster and metrics. |
| 5 — Frontend and Website Structure | Routes, shell, feature UX, API/state boundaries, accessibility/testing, proposed apps/web tree. | Draft for review. Resolve API gaps, local persistence, upload/cloud consent and PDF flows before implementation. |
| 6 — Security, Privacy, Reliability and Scaling | Threats, authorization/RLS, file/storage safety, consent, payments, abuse controls, ML integrity, recovery, logs/secrets, backups and scaling. | Draft for review. Approve limits, retention/deletion, recovery targets, operations ownership and payment rules. |
| 7 — Implementation, Migration, Testing and Deployment | Sequenced delivery and operational readiness for approved architecture. | Not started. Start after Plans 1–6 are reviewed and required decisions are recorded. |

Index: [architecture plans index](docs/architecture/architecture-plans-index.md)

## Project history

- 2026-10-23 — Started MVP by explicit user direction. Added a Next.js browser-local CSV workflow: bounded import, column profiling, visible quality findings, row preview, preview-before-apply cleanup, reset and CSV export. No server upload, auth, persistence, billing, ML scoring, or model training. `apps/web` lint and production build passed; scope and next gates are documented in README and `apps/web/README.md`.

- 2026-10-13 — Created this concise project memory with the architecture direction, Plans 1–6 state, open decisions and an ongoing dated-log rule. Initial record: [commit](https://github.com/chandravadiyaDeep/WTF/commit/5fc28daca3db489f1e1f4c4f5c3ff45814d017f6).
- 2026-10-12 — Connected work to repository WTF and used branch docs/numpa-v2-architecture.
- 2026-10-12 — Reviewed Plans 1–3 as inputs; drafted Plan 4 and indexed it. Plan 4 established shared processing contracts, explicit browser/cloud routing, cleaning previews, evidence, gated readiness scoring and leakage-safe evaluation.
- 2026-10-12 — Added Plan 5 frontend architecture and proposed website tree; updated index. Architecture only; no website code.
- 2026-10-13 — Added Plan 6 security/privacy/reliability/scaling and MVP launch checklist; updated index. Emphasis: authorize each resource plus RLS, private storage, bounded untrusted-file processing, consent, idempotent jobs/payments, data-safe logs and recovery tests.

## Open decisions

1. Supported MVP formats and configurable upload/row/column/page/time/memory limits.
2. Browser refresh persistence and consent preference behavior.
3. PDF extraction candidate response and OCR phase.
4. Dataset/history and experiment list/detail API contracts.
5. Readiness weights, supported model versions and task metrics.
6. Payment provider, token prices/discounts, partial billing, refunds and manual adjustment controls.
7. Data classification, retention/deletion, storage region/cache and backup/object recovery.
8. RPO/RTO, concurrency quotas, monitoring/on-call ownership and incident response.
9. Review Plans 2–6 and complete Plan 7 implementation/release sequencing before adding cloud services, paid flows, account support, or production deployment.

## Memory maintenance

After each meaningful project activity, append a short dated history entry with outcome, files/decisions changed and commit when available. Keep this file concise and update open decisions when resolved. Do not log routine tool calls, secrets, personal data or unverified assumptions.