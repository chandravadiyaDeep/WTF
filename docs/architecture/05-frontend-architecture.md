# NUMPA v2 — Plan 5: Frontend Architecture

## Status

Draft for review. This is a planning document only. It does not create frontend code or approve package versions, product limits, security policy, or pricing.

## Architecture

Use Next.js App Router, React and TypeScript. Prefer Server Components for marketing pages, route shells and static structure. Use Client Components at interactive boundaries: upload, browser processing, charts, pipeline editing, job status and forms. Supabase Auth handles sessions using supported server/browser clients; FastAPI remains the business API. Never expose service-role credentials or make the frontend authoritative for authorization, pricing, readiness, metrics, or billing.

Centralize typed FastAPI calls under /v1 in a client and endpoint modules. Use TanStack Query for server state, pagination, invalidation and job polling; React state/reducers for local interactions. A small store may hold ephemeral cross-route UI preferences only. Browser-only file bytes, rows and results remain feature-local volatile state and never enter URLs, telemetry, localStorage or persisted query cache. Plan 2 has not decided IndexedDB persistence.

Use Tailwind CSS, local wrappers over Radix UI primitives, Recharts for standard charts, Zod for client form feedback, and Vitest/RTL, MSW, Playwright for tests. Pin versions and verify Supabase SSR compatibility in Plan 7. UI estimates are advisory; backend/engine owns business decisions. Render supplied findings and evidence without recomputing them.

| Surface | Rendering |
|---|---|
| Marketing/product/pricing | Server rendered; trusted pricing source only |
| Auth pages/callback | Server session exchange and redirect with interactive forms |
| Workspace shell | Server layout with auth/workspace guard |
| Upload, cleaning, charts, live jobs | Client islands where browser interaction is required |
| Dataset/result pages | Server shell plus client query feature areas |

## Route map

API references are relative to /v1 and follow Plan 3 representative routes. Unfinalized contracts are dependencies, not speculative calls.

| Route | Purpose and principal UI | Data/API | Access |
|---|---|---|---|
| / | Landing and CTA | Public content | Public |
| /product | Features | Public content | Public |
| /pricing | Plans/token explanation | GET /billing/prices only if approved public-safe contract | Public |
| /login, /signup | Auth forms | Supabase Auth | Public |
| /auth/callback | Session exchange, safe redirect | Supabase Auth | Callback |
| /app | Home, recent datasets/runs, upload entry | Workspace history and dataset list contract needed | Authenticated |
| /app/upload | File picker/dropzone, consent and sheet/table selection | POST /datasets, upload-intents/upload-complete; browser adapter contract | Authenticated |
| /app/datasets | Searchable, paginated history | Dataset list contract needed | Workspace member |
| /app/datasets/[datasetId] | Overview, schema, version and workflow state | GET dataset and versions, history | Authorized |
| /app/datasets/[datasetId]/analysis | Findings, profile, column inspector | Analysis runs or explicit browser-results; GET run | Authorized |
| /app/datasets/[datasetId]/cleaning | Issue inbox, pipeline, operation config, preview, confirm, history | Cleaning previews/executions, job status | Authorized; cloud/paid gated |
| /app/datasets/[datasetId]/visualizations | Recommended and exploratory charts | POST/GET visualizations | Authorized |
| /app/datasets/[datasetId]/readiness | Task-specific score and evidence | POST readiness assessments | Authorized |
| /app/datasets/[datasetId]/models | Candidates, experiment setup/history | POST experiments/recommendations; list contract needed | Authorized |
| /app/experiments/[experimentId] | Frozen setup and training progress | Experiment detail contract needed; runs/jobs | Authorized |
| /app/experiments/[experimentId]/results | Metrics and comparisons | Training runs, comparisons | Authorized |
| /app/experiments/[experimentId]/results/[comparisonId] | Comparison detail and provenance | GET comparison | Authorized |
| /app/jobs/[jobId] | Durable progress, cancel/retry | GET job, POST cancel | Authorized |
| /app/reports/[reportId] | Preview/download | GET report, POST download-link | Authorized |
| /app/settings | Settings landing | Session/profile | Authenticated |
| /app/settings/account | Account/session preferences | Supabase Auth; profile contract if needed | Authenticated |
| /app/settings/billing | Balance, custom quantity, quote, payment, transactions | GET balance/prices/usage; POST quote/payment-order after launch | Authenticated, enabled |
| /app/settings/integrations | Integrations; Zapier future | No MVP API | Feature gated |
| /app/settings/white-label | Enterprise branding | No MVP API | Entitled future |
| /app/settings/developer | API/developer | Credentials deferred by Plan 3 | Entitled future |
| Not-found/error | Safe recovery and navigation | Normalized request ID | Public or parent access |

Dataset path ID is authoritative. Pin non-current immutable version in a query parameter; otherwise resolve and display backend current version. Jobs, experiments, reports and comparisons use durable IDs in paths. Query parameters may store safe tabs/filters, never private values, filenames, credentials, signed URLs or local data. Refresh restores cloud records from server. Local-only work discloses refresh loss unless persistence is later approved.

## Workspace shell and UX

Persistent desktop sidebar: Home, Data Analysis, Data Preprocessing / Cleaning, Data Visualization, ML Readiness, ML Algorithms & Results, Settings. Settings expands to Account, Plans & Billing, Integrations, White Label, API & Developer. Active parent remains highlighted on nested results/jobs. Header shows workspace, dataset/version, active job link, trusted token balance/update time, notifications and account. Mobile navigation is a focus-managed drawer with Escape close and focus restore. Use breadcrumbs, skip link, accessible announcements and responsive tables.

Home/upload supports CSV, Excel, JSON, PDF and future adapters. Client validation is only a hint; parser/backend validates. Show limits and processing destination, and require cloud consent before bytes leave device. Excel shows sheets and formula/hidden/merged warnings. PDF shows table candidates with page, method, confidence, preview and findings; ambiguous candidates require selection. Never represent failed extraction as an empty table. Automatic workflow may start safe analysis, but consent, paid work and material transformations retain explicit gates.

Analysis leads with shape and key findings, then Overview, Columns, Quality and Relationships. Column inspector shows type/confidence, missingness, distribution, uniqueness and warnings. Wide tables paginate/virtualize. Approximation/sample method and size are disclosed. PII signals are hypotheses and examples masked by default.

Cleaning uses an issue inbox and pipeline builder. Distinct editors for missing values, duplicates, type parsing/locale, encoding, scaling, outliers, feature/text operations. Explain risks and advanced controls. Pipeline ordering is validated. Preview shows affected fields/rows and before/after evidence, with sample disclosure. Confirmation binds to input version/fingerprint and config hash; changed inputs invalidate preview. Execution produces immutable version. Show progress, cancellation, errors, lineage, history and safe download. Undo means prior immutable version or supported inverse operation; do not promise arbitrary rollback.

Visualization recommends distributions, category frequencies, quality, compatible relationships and time series only when supported by evidence. Every chart names dataset version, source run, sample/aggregation and limitations, with table/text equivalent; no causal claims.

Reusable explanation pattern: finding, plain meaning, why it matters, recommendation/reason, evidence/chart, action and before/after effect, limitations. Technical terms get short help. Readiness shows a final score only when backend status says complete; otherwise show pending checks. Require task and target/time/horizon inputs. Candidate count may be under four. Training uses real job stages, not invented progress. Results distinguish validation/test/fold/internal metrics, show units/direction/spread/undefined reasons, and identify best model only on comparable results and backend-selected objective. Report downloads use authorized backend artifacts.

Billing displays backend balance and quote, custom token quantity (one when permitted), effective price returned by backend, payment state and history. UI never computes the authoritative total or credits balance; verified payment event controls completion. Integrations, White Label and Developer remain marked planned until API/security/entitlements exist.

Shared components: layout shell/sidebar/header/context/job/breadcrumb; UI form/dialog/drawer/tabs/table/pagination/badge/alert/progress/skeleton/empty state; charts frame/renderer/table alternative/sample notice; explanations finding/evidence/recommendation/limitation/metric/before-after. Feature modules own interactions and API-to-view adapters, not numerical business logic.

## State and API

| State | Owner |
|---|---|
| Auth | Supabase Auth and SSR session adapter |
| Workspace | Server membership/active workspace preference |
| Dataset/version | Backend immutable records; local session for browser-only |
| File bytes/rows | Feature-local volatile browser memory |
| Job | Durable backend; query cache polls |
| Cleaning draft | Local reducer keyed to input version; preview freshness |
| Readiness/experiments/results | Backend versioned records |
| Billing | Backend quote/balance/payment/ledger |
| UI preferences | React state; optionally persist nonsensitive preferences |

Query keys include workspace/resource/version. Abort stale reads, isolate late responses and invalidate after mutations. Retry bounded safe reads only; do not retry validation/auth/insufficient balance. Use stable idempotency keys for mutations. After timeout check status instead of blindly resubmitting. Poll jobs after 202/active reference, stop at terminal; refresh on focus/reconnect. Plan 3 defers SSE. Paginate histories. Cancellation is requested until worker acknowledgement.

API client handles bearer token, correlation/idempotency, response parsing and problem+json normalization. Public API URL may be client-visible; server secrets never use NEXT_PUBLIC variables. Distinguish validation, 401, privacy-preserving 403/404, 409, insufficient-token (Plan 3 policy may be 402/409), 429, offline/timeout and 5xx. Never show stack traces, storage keys, raw payloads or file contents. Do not persist signed links. Dataset/history list, experiment detail/list and account profile routes require final contract agreement.

## Accessibility and testing

Target WCAG 2.2 AA for implementation review: semantic headings, keyboard navigation, visible focus, contrast, reduced motion, labeled fields, focus-managed dialogs and clear consequence for billable/destructive actions. Announce meaningful job stages politely; use percentage only when real. Charts provide accessible table/text alternatives. Tables support keyboard, pagination/virtualization and mobile scroll/detail. Loading, empty, partial, failed and completed states are distinct.

Proposed tests: Vitest/RTL, MSW, Playwright and axe checks; exact gates in Plan 7.
- Unit: error normalization, query keys, draft reducer, stale preview, metric/price display; assert UI does not own scores/charges.
- Component: consent, operation-specific forms, evidence, chart alternative, focus, progress and empty/error states.
- Integration: auth refresh, API schema fixtures, polling/cancel, stale response isolation, upload failure and quote expiry/no optimistic credit.
- E2E: auth; CSV/Excel; PDF ambiguity; analysis→preview/confirm→new version; local-only no upload; pending/completed readiness; async training/comparison; authorized report; payment pending until backend confirms.
- Resilience: navigation during work, local refresh disclosure, duplicate submit, offline/429/5xx, unauthorized IDs, wide table/mobile keyboard. Visual snapshots are not proof of working product.

## MVP order and dependencies

1. Layout/auth guard, primitives, typed API/error client, flags.
2. Workspace shell, Home, CSV/Excel/JSON upload, history/detail, consent/local disclosure, job link. PDF after stable contract.
3. Analysis findings/profile/column evidence.
4. Cleaning operation editors, pipeline, bound preview/confirmation, execution/version history.
5. Visualization and explainability.
6. Task-specific readiness, including pending state.
7. Candidates, training, valid metrics/comparison/provenance.
8. Reports and billing after artifact/payment controls.
9. Zapier/integrations, White Label and Developer after security/API approval.

Plan 1 provides user journey and confirmation. Plan 2 defines workspace/RLS, immutable versions, private artifacts and browser-only boundaries; persistence is unresolved. Plan 3 supplies auth, uploads, jobs, billing and representative /v1 endpoints; list/detail routes need agreement. Plan 4 supplies canonical schema, parser candidates, cleaning preview, evidence/chart contracts, readiness and ML evaluation. Plan 6 must finalize threat model, local persistence, telemetry, retention, headers/cookies, quotas and upload security. Plan 7 decides package pins, CI, generated API types, test gates and deployment.

Implementation blockers: finalize dataset/history and experiment list/detail contracts; decide browser refresh persistence; approve upload limits/cloud-consent UX; stabilize PDF candidate response; approve payment provider and MVP billing launch. These do not block this draft. Plan 6 is not started.
