# NUMPA v2 — Plan 3: Backend Architecture

## 1. Status and recommendation

**Status:** Draft for review. This document defines an implementation-ready modular backend direction; it is not application code or a final deployment topology.

**Recommendation:** build one Python/FastAPI modular monolith with explicit transport, service, repository, and infrastructure boundaries. Run the API and one separate worker process from the same application package and deployable unit initially. Use Supabase Auth for identity, PostgreSQL for application state and durable jobs, and private Supabase Storage for cloud files/artifacts. FastAPI handlers validate/translate HTTP and call services; they do not implement data processing or billing rules.

Use user-scoped database access with the verified caller token where RLS should enforce user permissions. Use a narrowly scoped service context only for trusted worker/billing/administrative operations, with explicit workspace/resource checks. Never place service-role secrets in the frontend. Supabase documents that service-role access bypasses RLS, so it must remain a protected server credential. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

Initial long-running work uses PostgreSQL-backed job records with a separate worker and lease/claim mechanism. This avoids selecting a queue vendor before workload evidence exists. FastAPI in-process background tasks are reserved for small best-effort work such as a noncritical notification; heavy training/analysis belongs in the worker process. [FastAPI background-task guidance](https://fastapi.tiangolo.com/tutorial/background-tasks/)

## 2. Proposed backend structure

The names below describe responsibilities, not files to generate now. Exact packaging and SQL client/library choices belong in the implementation plan after Plan 4's contracts are agreed.

| Layer | Proposed package area | Responsibility |
|---|---|---|
| Application entry | app/main, app/api/v1 | Construct app, middleware, lifespan, versioned router; expose health endpoints. |
| API transport | app/api/v1/routes, app/api/dependencies, app/schemas | Parse HTTP, request validation, authentication dependencies, response schemas/status codes. No business rules or direct processing. |
| Core | app/core/config, errors, logging, security | Typed settings, error codes/problem responses, request context, correlation IDs, token verification interfaces. |
| Domain | app/domain | Task/status enums, value objects, operation contracts, domain exceptions, invariants independent of FastAPI/storage. |
| Services | app/services | Use cases and orchestration: ingestion, analysis, cleaning, readiness, modeling, reports, jobs, billing. Coordinate repositories/providers. |
| Repositories | app/repositories | Interfaces and implementations for workspace, dataset, run, job, result, artifact, and billing persistence. Own transactions and query shapes, not product decisions. |
| Infrastructure | app/infrastructure/auth, database, storage, queue, payments | Supabase/JWT adapter, Postgres/Supabase data adapters, private storage adapter, job claim/dispatch adapter, future payment provider adapter. |
| Processing adapters | app/processing | Format readers and operation/ML engine adapters implementing Plan 4's versioned contracts. Keep CPU-heavy work out of request handlers. |
| Worker | app/worker | Claim/lease jobs, dispatch to services/adapters, heartbeat, settle outcomes, retry/fail/cancel and clean temporary outputs. |
| Tests | tests/unit, integration, api, contracts | Test business invariants, RLS/tenant access, API behavior, worker idempotency and browser/cloud contracts. |

Prefer dependency injection for service/repository/provider interfaces. API schemas are not database rows or internal domain objects. Keep external provider SDK calls behind adapters. Avoid an early microservice split; separate processes are enough for API and worker scaling.

## 3. Backend modules

| Module | Responsibility; main inputs → outputs | Dependencies |
|---|---|---|
| Authentication/authorization | Verify access token; resolve actor, workspace membership/role and access to resource → authorized actor context or 401/403/404 | Supabase Auth, workspace repository, policy helpers |
| Ingestion/format detection | Upload intent, bytes/object metadata or browser manifest → detected format, ingestion status, dataset/asset/version metadata, structured errors | Dataset repository, storage adapter, format registry, job service |
| Validation/profiling/analysis | Exact dataset version or local operation input → schema/profile summaries, findings/evidence, visualization specs, potential task signals | Processing contracts, findings/run repositories, visualization service |
| Cleaning/preprocessing | Versioned pipeline and input version → preview delta, execution, output version when persisted, before/after evidence | Operation registry (Plan 4), dataset/pipeline/job repositories, storage adapter |
| Visualization | Typed spec + authorized source metadata → validated chart spec and optional artifact | Analysis/result repositories, artifact service, rendering adapter |
| ML readiness | Dataset version + immutable profile version + task context → score, dimensions, warnings/evidence | Readiness config/results repositories, deterministic processing adapter |
| Recommendations | Task, dataset summary, readiness and constraints → ranked candidate snapshots and reasons | Experiment/recommendation repository, algorithm capability registry (Plan 4) |
| Training/evaluation | Experiment/protocol + candidates → training job, model artifact reference, split-specific metrics and status | Job service, processing/model adapters, dataset and artifact repositories |
| Comparison | Selected completed runs + metric basis → immutable comparison snapshot | Run/metric/comparison repositories |
| Explanations/evidence | Finding/result facts and evidence → consistent plain-language explanation and structured evidence links | Findings/evidence repository, explanation templates; no unsupported claims |
| Reports | Authorized source refs + template version → report job and private artifact metadata | Job, artifact, report-source repositories; PDF renderer |
| Jobs/history | Idempotent command → durable job, attempts/events/status/output refs | Job repository, worker, optional outbox/dispatch mechanism |
| Pricing/wallet/billing | Operation quote, reservation, trusted completion/payment event → quote, hold, capture/release/credit and usage records | Billing repository/transaction routine, job service, future verified payment adapter |
| Storage/versioning | Authorized object intent, metadata and lifecycle transition → private object key and immutable version ref | Supabase Storage, dataset/artifact repositories, cleanup process |
| Integrations/API access (later) | Scoped API credential, provider authorization, webhook event → metered access/delivery history | Hashed credential store, encrypted secret vault reference, rate limiter; not MVP |

## 4. API structure and MVP routes

All product routes are under /v1. JSON request/response schemas are versioned independently where operation contracts can evolve. Authenticated routes require a valid bearer access token and workspace authorization. Resource IDs never substitute for access checks.

| Route group | Representative routes | Responsibility and execution |
|---|---|---|
| Health | GET /health/live; GET /health/ready | Liveness is process-only; readiness checks required dependencies with sanitized output. No user auth; operational access/rate limits apply. |
| Datasets | POST /datasets; GET /datasets/{dataset_id}; GET /datasets/{dataset_id}/versions; POST /datasets/{dataset_id}/upload-intents; POST /datasets/{dataset_id}/upload-complete | Create metadata and authorize upload. Small supported metadata operations sync; file bytes go directly to private Storage using a short-lived authorized URL; completion verifies object then finalizes version. |
| Analysis | POST /datasets/{dataset_id}/analysis-runs; GET /analysis-runs/{run_id} | Small browser-compatible analysis may run client-side; cloud analysis returns a run or 202 job reference. Persist exact version/config and structured findings. |
| Cleaning | POST /datasets/{dataset_id}/cleaning-previews; POST /datasets/{dataset_id}/cleaning-executions; GET /cleaning-executions/{execution_id} | Preview is read/compute-only; execute requires confirmation token/reference for material change. Cloud execution may return 202; creates new immutable version, never overwrites input. |
| Visualization | POST /visualizations; GET /visualizations/{visualization_id} | Validate spec and source authorization. Render locally where possible; cloud artifact generation may be asynchronous. |
| Readiness/recommendations | POST /datasets/{dataset_id}/readiness-assessments; POST /experiments/{experiment_id}/recommendations | Persist exact profile/config version and evidence; return task-specific score or candidate set. Sync for small work, 202 if expensive. |
| Training/evaluation | POST /experiments; POST /experiments/{experiment_id}/training-runs; GET /training-runs/{run_id} | Freeze task/protocol config before run; training is 202 job. Expose status and split-specific results only after authorized read. |
| Comparisons | POST /experiments/{experiment_id}/comparisons; GET /comparisons/{comparison_id} | Validate completed run membership and common comparison basis; create immutable result. |
| Jobs/history | GET /jobs/{job_id}; POST /jobs/{job_id}/cancel; GET /workspaces/{workspace_id}/history | Pollable status and cancellation request. SSE/websocket is deferred until polling is insufficient. |
| Reports | POST /reports; GET /reports/{report_id}; POST /reports/{report_id}/download-link | Queue generation if needed; signed download URL only after workspace check. No public object URLs. |
| Billing | GET /billing/balance; GET /billing/prices; POST /billing/quotes; POST /billing/reservations; POST /billing/payment-orders; GET /billing/usage | Read-only summary/price; quote snapshots current configuration; reserve before paid work; payment order does not credit wallet until verified provider event. Paid endpoints launch only after billing controls. |

MVP priority is datasets/upload, analysis, cleaning preview/execution, jobs, readiness, recommendations and a minimal model experiment path. Reports, comparison, and billing follow the dependencies noted below. Do not create CRUD endpoints for every table. Pagination, filtering, idempotency headers and response schemas should be consistent across list/create routes.

## 5. Workflow boundaries

| Workflow | API boundary and service | Persistence | Errors and tests |
|---|---|---|---|
| Dataset upload | POST dataset/upload-intent → authorization and ingestion services | Pending dataset/asset, private object, finalized version/checksum after upload completion | Reject unsupported/malformed/oversized file with stable code; expired/abandoned intent cleaned. Test unauthorized workspace, invalid format, replayed completion, object mismatch. |
| Automatic analysis | POST analysis-run → analysis service and processing adapter | Job if cloud/long-running; immutable run, summary, findings, evidence, optional visualization spec | Partial extraction/unknown type represented explicitly. Test profile determinism, task signal limits, local/cloud contract parity. |
| Cleaning | preview and execute routes → cleaning service | Preview not a committed output version; confirmed execute records pipeline version, execution, new output version and lineage | Confirmation mismatch/stale input returns conflict; failed run leaves source unchanged and cleans partial output. Test no silent mutation, idempotent retry, rollback/cleanup. |
| Readiness | POST assessment → readiness service | Assessment snapshots dataset + profile version + dimension scores/evidence | Missing target/task or incompatible config returns actionable validation error. Test deterministic score for fixed version and no rewrite after config update. |
| Model comparison | experiment/recommend/train routes → experiment/model service and worker | Experiment config/protocol, job/attempts, immutable runs/metrics/artifact refs, comparison | Unsupported task/algorithm fails honestly; no fabricated metrics. Test split-role separation, time-order safety, job retry behavior. |
| Token billing | quote/reserve → billing service; completion → trusted settlement routine | Price/discount snapshot, reservation, ledger entries, usage; coupled transactional writes | Insufficient balance 409/402 policy; retries with same idempotency key return same logical operation; test concurrent reservations, duplicate payment webhook and double capture. |

## 6. Authentication, authorization, and data access

1. Require HTTPS and Authorization: Bearer access token for user routes. Validate signature using Supabase project's supported signing-key method, issuer, audience, expiry and subject. For asymmetric signing, use the project's JWKS with bounded cache/rotation handling; for legacy symmetric signing, use a supported Auth verification path rather than implementing crypto or storing the signing secret in application code. Supabase documents claims/JWKS validation and the alternative validation path for shared-secret signing. [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts)
2. Convert verified subject into an actor context. Resolve workspace membership and role from PostgreSQL for each requested workspace/resource. Do not trust workspace_id, role, owner, status, payment_verified, token balance, or job completion values from request JSON.
3. Check every dataset/version/job/report/artifact/billing reference belongs to the authorized workspace. Same-workspace composite FKs provide defense in depth, not a replacement for policy checks.
4. User-context repository calls should preserve the caller's JWT so Postgres RLS applies. If a trusted operation uses service credentials, a dedicated service path must explicitly re-check workspace/resource state and allow only specific operations; never make a generic service-role CRUD layer.
5. Storage object reads/writes follow authorization to metadata and private bucket policy. Backend issues short-lived signed URLs only after checks. Do not log URLs or expose service-role keys.
6. Payment provider webhooks are not user-authenticated routes: verify provider signature, timestamp/replay window, provider event ID uniqueness, and expected order before calling the trusted credit routine.

Supabase RLS relies on policies and grants for exposed data; service-role access bypasses those policies. Test both the user-context path and privileged path. [Supabase RLS and service role](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 7. Browser/cloud processing contract

Plan 4 defines the actual operation schema and supported engines. Plan 3 requires a shared, versioned envelope with operation_code, operation_version, input descriptor, parameters, task context, requested output, and result/evidence schema. Responses include status, warnings, output descriptor, provenance and capability/version information. Unknown operation versions fail explicitly.

- Browser-eligible operations receive data in the browser and do not send raw rows to the API. The API may provide configuration/reference metadata or receive an explicit request to save selected results.
- Cloud operations require explicit processing consent, a finalized private object/version, workspace authorization, limits and a job. The worker downloads through trusted access and writes private outputs.
- A browser-generated result that the user asks to persist is labeled source_engine=browser and includes operation/version, input fingerprint or local version reference, result/config hash, and user consent. The server stores only the submitted bounded result or output file and metadata that the user selected; it does not claim to have processed or retained input bytes it never received. Apply validation/size limits and clearly distinguish a client-asserted result from a server-recomputed result.
- Cleaning operation names/parameters match the same contract across browser and cloud adapters. Processing engine choice, parser libraries, browser memory limits and size thresholds are Plan 4 decisions, not invented here.

## 8. Background job lifecycle

Use states queued → processing → completed, failed, or cancelled. Cancellation requested is a separate flag/event until a worker acknowledges it. Terminal jobs do not reopen. A user retry either creates a new job linked to its predecessor or reuses the same job only for an internal attempt retry; it never creates a second billing reservation unintentionally.

Initial approach: PostgreSQL processing_jobs is durable truth; an outbox row records dispatch intent in the same transaction as job creation; a separate worker process claims eligible work with a short lease/heartbeat, bounded concurrency and retry policy. The worker records job_attempts, progress summaries, sanitized errors, output refs and terminal state. Claim/lease implementation and isolation level are Plan 7 implementation details. Files and large payloads stay in Storage, not queue messages or job rows.

Retry safety uses unique (workspace_id,idempotency_key), request/config hash equality, unique output role/version, reservation idempotency and unique terminal billing event. Repeated key with a different request hash returns conflict. Worker checks cancellation between safe stages. On failure/cancel it removes incomplete outputs idempotently, records the final reason and settles/releases reservation according to approved policy. Partial work is billable only if the user-visible quote and policy explicitly allow it.

A dedicated external queue becomes justified when measured job volume, scheduling priorities, backpressure, latency, queue isolation or worker availability exceed the database-backed approach. Keep worker and API in the same modular codebase until independent ownership/deployment needs are demonstrated.

## 9. Token billing integration

Billing service owns quotes, reservations and settlement. Request handlers cannot select a cost. Quote uses the active price/discount version and returns an immutable snapshot. Paid job submission transactionally checks available balance and creates one reservation plus job/outbox record. The worker receives reservation ID, not authority to choose price. On success a trusted finalizer captures authorized actual cost and releases unused reservation in one database transaction. On failure/cancel it releases or applies only reviewed partial-work rules. If actual cost exceeds authorization, require a new user-approved reservation.

Payment completion is credited only after signed provider webhook verification and unique event/order checks. Webhook retries are idempotent. User balance routes are read-only. Keep price/discount versions in quote snapshots so later changes never rewrite historic order/job billing. Plan 2's total/reserved/available invariants and append-only ledger remain the accounting contract; Plan 3 defines the API/transaction boundary, and Plan 7 tests concurrency and recovery.

## 10. Errors, logging, configuration, health, and tests

### API errors

Return a consistent application/problem+json body: type, title, status, stable code, safe detail, request_id, and optional field_errors. Use 401 unauthenticated, 403 or privacy-preserving 404 for inaccessible resources, 409 for state/idempotency conflicts, 422 for invalid input, 429 for rate limits, and 5xx with generic client detail. Never expose stack traces, SQL, storage keys, paths, tokens, payment payloads or file contents. Validation errors identify fields without echoing sensitive values.

### Resource and file handling

Define approved limits in configuration once Plan 4 determines supported operations. Validate declared and actual byte length, media type by content inspection, format/parser result, decompression/row/column limits, timeouts and worker memory. Reject corrupt/unsupported content with stable error codes. Stream uploads/downloads; do not buffer unbounded files in API memory. Worker timeout/resource exhaustion becomes a retryable or terminal sanitized job outcome according to error class. Keep source untouched on failed transforms.

### Logging and settings

Emit structured JSON logs with request_id, trace_id, actor/workspace IDs where policy allows, route, operation, job_id, duration and error code. Never log authorization headers, raw cells, signed URLs, provider secrets, payment payloads or full user filenames. Redact and restrict logs; define retention in Plan 6.

Use typed environment-backed settings for Supabase URL/publishable key, server-only service secret, Auth verification/JWKS configuration, database access, storage bucket names, worker concurrency/timeouts, request limits, log level, and payment webhook secret when enabled. Keep safe variable names/placeholders in an eventual .env.example; secrets use deployment secret storage and rotation, never source control. Avoid putting secret values in exceptions or health responses.

Health: /health/live reports process liveness; /health/ready checks required dependencies such as database and Auth configuration with timeouts and sanitized dependency status. Do not expose versions, secret configuration or tenant data.

### Test strategy for implementation phase

- Unit: service rules, task validation, cleaning preview/apply invariants, readiness determinism, pricing quote snapshot, reservation/capture/release idempotency.
- Repository/integration: PostgreSQL constraints, same-workspace foreign keys, RLS allow/deny matrix, transaction rollback, storage upload-intent/finalization and deletion reconciliation.
- API: auth expiry/invalid tokens, role checks, cross-workspace UUID access, schema validation, stable errors, 202 job behavior and polling/cancellation.
- Worker: lease expiry/retry, duplicate dispatch, request-hash mismatch, partial output cleanup, cancellation, payment webhook duplicate and double-capture prevention.
- Contract: same operation names/parameters and result schema for browser/cloud adapters; local-only path sends no raw rows.
- ML evaluation: data leakage tests, split-role integrity, forecasting time-order/gap enforcement and metric correctness.

## 11. MVP implementation order and dependencies

1. Approve Plan 2 privacy/storage/retention decisions needed for first release; select the initial supported file and size limits with Plan 4.
2. Build app shell, settings/secrets, JWT verification, actor/workspace authorization, repository transaction boundary, problem responses, request IDs, and RLS integration tests.
3. Implement dataset metadata, cloud upload intents/finalization, browser-local no-upload behavior, and validation/format adapter contract.
4. Implement durable jobs/outbox/worker, attempt state, cancellation, retry/idempotency, storage cleanup, and job APIs.
5. Add analysis/profile/findings, cleaning preview and confirmed execution with immutable dataset lineage, then readiness/recommendations using versioned deterministic contracts.
6. Add task-aware experiments/training/evaluation/comparison after Plan 4 validates supported task operations and leakage-safe protocols.
7. Add report generation/downloads and billing/payment only after artifact lifecycle and atomic ledger settlement are tested.
8. Add integrations/API credentials/webhooks/white-label only in a later approved phase.

Plan 2 supplies workspace/RLS, dataset/version, run/result, job, artifact, and ledger entities. Plan 3 must align with its draft relationships; any physical-schema change is recorded for Plan 7 migration planning. Plan 4 is a hard dependency for operation contracts, format readers, browser/cloud parity, limits, readiness computation, candidate registry, evaluation protocols and resource estimates. The API can be scaffolded before it is finished, but should not freeze processing payloads or model interfaces prematurely.

## 12. Decisions and blockers

**No blocker to this architecture draft.** Proposed defaults for the next phase: modular monolith; PostgreSQL-backed job table plus separate worker and outbox; caller-token RLS access for ordinary user requests; narrowly scoped server operations for finalization/billing; polling for job status; browser-only processing remains local unless explicitly persisted.

Before production implementation, confirm:
- Exact JWT signing mode/verification adapter and database repository mechanism.
- Per-upload consent language, browser persistence mode and policy for saving client-computed results.
- Initial file formats, byte/row/column/time limits and worker resources (Plan 4).
- Which workloads are synchronous versus jobs after profiling target hardware.
- Payment provider and approved partial-completion/refund/expiry policy.
- RPO/RTO, log retention, rate limits and operational alerting in Plans 6/7.

These are implementation choices or later-plan inputs rather than blockers to proceeding with architecture. Do not begin Plan 4 automatically; wait for the next instruction after this draft is reviewed.
