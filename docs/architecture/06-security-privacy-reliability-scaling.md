# NUMPA v2 — Plan 6: Security, Privacy, Reliability and Scaling

## 1. Purpose and decisions

**Status:** Draft for review. Architecture guidance only; no code, migrations, deployment settings, retention durations, regulatory claims, or numeric product limits are approved here.

**MVP recommendation:** keep the existing modular-monolith/API plus one separate worker process, Supabase Auth/PostgreSQL, private object storage, and explicit browser/cloud processing choice. Enforce authorization at both FastAPI and database/storage boundaries. Treat files as hostile input, bound work in configuration, and make all paid or mutating operations idempotent. Ship only the smallest supported format and workflow set that can meet these controls.

This plan does not promise compliance certification or a particular recovery objective. Before launch, the owner must choose service region, supported limits, retention, backup tier, deletion targets and operational response ownership.

## 2. Threat model and priority

### Assets and trust boundaries

Assets include Auth sessions; workspace membership; uploaded files and extracted content; immutable dataset versions, findings, reports, model artifacts and readiness/experiment records; token quotes, payments, reservations and ledger; API/integration secrets; worker credentials and temporary files; logs, backups and deployment configuration.

Trust boundaries are browser ↔ Next.js ↔ FastAPI ↔ PostgreSQL/Storage; API ↔ worker/job queue; payment provider ↔ public webhook; operator/CI ↔ production configuration; and one workspace/job ↔ another. Browser file metadata and client-computed results are untrusted claims. A UUID, storage key, filename, signed URL, client-reported balance, job status or role is never proof of authority.

### Prioritized threat register

| Priority / threat | Preventive controls | Detection and recovery | MVP gate |
|---|---|---|---|
| P0 cross-workspace dataset/report/job access via ID manipulation | Authenticate every API call; resolve membership/role server-side; authorize each resource and every parent/child reference; tenant RLS and same-workspace FKs; private Storage policies | Cross-tenant negative tests for each resource class; alert on authorization failures; revoke credentials/session and review audit trail | Required before any user data launch |
| P0 privileged key, signing secret or payment credential leak | Secrets only in server runtime secret store; separate dev/prod; least privilege; no client bundle/log/source; CI secret scanning; rotation/revocation procedure | Secret scan and access audit; rotate/revoke immediately after exposure; assess affected objects/events | Required before production |
| P0 forged/duplicate payment event or concurrent double spend | Provider-maintained signature verification over raw request; timestamp/replay checks where supported; unique provider event/order IDs; atomic balance lock/conditional update; append-only ledger and idempotency key | Duplicate/replay tests, ledger reconciliation and alert on mismatches; compensating ledger entry, never edit posted entries | Before paid work or purchases launch |
| P0 accidental cloud transfer of browser-only data | Browser engine must remain local; explicit per-operation cloud choice/approved preference; distinct upload intent; route failure produces choice, never silent fallback | Test network requests/local workflow; log consent event metadata without dataset contents | Required before hybrid processing launch |
| P1 malicious or malformed file, parser exploit, decompression/resource exhaustion | Format allowlist; signature + parser validation; size/shape/page/depth limits; time and memory ceilings; safe libraries and patched dependencies; worker isolation; no macro/code execution | Sanitized parser failure telemetry, resource-exhaustion alarms, dependency scanning; quarantine/delete partial artifacts | Required before file ingestion |
| P1 insecure object URL/key or orphaned private object | Opaque keys, private buckets, authorize before signing, short expiry, validate metadata after upload, lifecycle sweeper, controlled deletion | Audit issuance/finalization, periodic object↔metadata reconciliation; revoke access then asynchronous delete | Required before cloud uploads |
| P1 compromised account/session | Supabase Auth controls, secure session/cookie configuration, reauthentication for sensitive account/payment actions where supported, bounded session handling, safe redirects | Auth anomalies and repeated failures; revoke session/rotate credentials through Auth workflow | Required for authenticated launch |
| P1 job duplication, stale worker or double charge | Durable DB state, idempotency/config hash, lease/claim compare-and-set, terminal-state guard, unique output role, reservation state machine, bounded retries | Lease/queue age and stuck-job alerts; reconciliation sweeper; recover or fail terminally without duplicate outputs | Required for cloud jobs; billing controls before paid |
| P1 excessive requests/training concurrency | Identity/workspace/operation rate limits; upload/job/concurrency quotas; resource budgets independent of token balance; bounded body/response/page size; timeouts | 429/abuse metrics, queue/backpressure and capacity alerts; block or throttle account/workspace | Required before public launch |
| P1 misleading ML result or explanation | Fold-local preprocessing, task-valid splits, temporal ordering, frozen protocols/config/seed, compatible comparison basis; explanation layer renders facts only | Protocol/metric validation tests, provenance review, undefined metrics explicitly unavailable | Required before model evaluation release |
| P2 sensitive logging/analytics/backups or retained derived data | Data minimization; structured allowlisted events; no raw rows/tokens/signed URLs; restricted access and approved retention; encrypted transport/provider controls | Log/telemetry review, access audit, restore/deletion drills | Baseline controls at MVP; mature audit later |
| P2 supply-chain/deployment misconfiguration | Lock dependency versions, automated vulnerability/secret checks, reviewed migrations, protected production secrets, least-privilege CI/deploy identity, HTTPS and secure headers | CI findings, deployment config review, patch SLA and incident process | Required baseline; automate more at growth |

Prioritize P0 and P1 launch gates. P2 does not justify delaying a small MVP for enterprise tooling, but data-safe logs, backups, secret hygiene and migration discipline are still baseline controls.

## 3. Authentication and authorization

### Responsibility boundaries

- **Supabase Auth:** credential lifecycle, user identity and signed access/session tokens. It does not decide access to a dataset or business resource.
- **Next.js:** protects page rendering, handles session refresh and safe redirects, and presents controls. Page guards improve UX but are not API authorization.
- **FastAPI:** verifies bearer token signature/issuer/audience/expiry using the configured supported Supabase verification method; resolves subject to actor; resolves active workspace membership/role; authorizes the requested object and all referenced objects on every request. Reject 401 without valid identity, and 403 or privacy-preserving 404 when access cannot be proven.
- **PostgreSQL RLS/grants:** enforce tenant row visibility for user-context calls; least-privilege grants control which actions/columns can be changed. RLS complements, never replaces, explicit service-layer authorization.
- **Storage policies:** keep buckets private and authorize object operations through signed-in user policies where feasible. Trusted backend signing occurs only after checking current workspace/resource access and object metadata.
- **Worker/trusted service:** receives job/reservation IDs and narrowly scoped credentials, rechecks workspace/job state, and can access only the required objects and operations. Never accept client-supplied “trusted” status, price, role, output, payment verification or ownership.

Personal workspace owner is represented as an active owner membership. Future organization workspaces reuse the same membership and role checks; team management, SSO and enterprise policy are not MVP. Resource IDs are selectors only. For service-role/bypass-RLS paths, execute one narrow operation with explicit workspace/resource checks and audit context; never expose generic privileged CRUD. Protect and review SECURITY DEFINER functions: fixed search_path, narrow execute grants, explicit ownership/tenant checks and no public execution unless intended.

### Database controls

- Enable RLS on every user-accessible tenant table and test policies using real authenticated roles. Apply consistent workspace membership predicates. Include workspace_id in tenant children and composite same-workspace FKs for critical parent references.
- Revoke default/broad grants; grant only required table/column/function actions. Use constraints and state transitions to prohibit client changes to trusted roles, price snapshots, payment status, processing outcomes, wallet balance, and completed results.
- Financial ledger and security/audit events are append-only to ordinary app roles. Corrections use authorized compensating records. Wallet is a derived/cached display value reconciled to ledger.
- Review all views, RPCs and SECURITY DEFINER functions for owner/bypass behavior and execute privileges. Use transactions/locking or equivalent atomic routines for reservations, captures and payment credits.
- Apply migrations through reviewed, version-controlled SQL; test RLS, grants, foreign keys, migration rollback/forward behavior and data migration against synthetic fixtures before production. Separate migration credentials from runtime credentials.

RLS is a database policy, not evidence that the API checked parent access or that a Storage object is safe. Test user-token and trusted worker paths independently.

## 4. Storage and file-processing safety

### Private object lifecycle

MVP uses a small number of private buckets, opaque generated keys based on internal IDs, and metadata rows linking object/workspace/version. Original filenames are display metadata only: normalize and escape them; never use them as paths or keys. No public bucket for dataset, report or model content.

Trusted API creates a short-lived upload intent only after authorization and limits checks. On completion it checks that the expected object exists and verifies actual bytes, size, content/signature, checksum where available, allowed format and associated intent/workspace before finalizing asset/version. Treat signed upload/download URLs as bearer credentials: keep out of logs, analytics, referrers, reports and long-lived client state. Do not issue a URL merely because the user knows an object key.

Storage vendor behavior matters: Supabase private signed URLs are time-limited, but current docs state signed URLs remain valid until expiry and CDN-cached responses may outlive token expiry based on cache TTL. Therefore short TTL alone is not an immediate revocation guarantee. Use minimal cache TTL for sensitive exports, prefer authenticated access where the product needs immediate revocation, and verify current provider behavior before launch. Revoke metadata access first, delete object, and account for cache propagation.

Deletion transitions metadata to inaccessible/pending-delete, cancels dependent jobs, deletes source and derived objects idempotently, records completion, and periodically reconciles missing/orphaned objects. Retain only audit/financial records required by an approved policy; do not invent retention duration here.

### Untrusted file boundary

Initial allowlist: CSV, XLSX (not macro-enabled), JSON/NDJSON, and PDF only when the extraction adapter is ready. Add formats only with adapter tests and declared limits. Extension and declared MIME are hints; inspect signature/container and actual parser result. Enforce request-body and actual byte limits, row/column/sheet/page/nesting/expanded-content limits, parser time and memory limits from central configuration. Choose values with product workload and provider constraints; this plan does not fabricate numbers.

- Reject malformed/corrupt/encrypted/unsupported files safely. Do not execute macros, formulas, embedded scripts, external links or uploaded code. NUMPA does not evaluate spreadsheet formulas.
- Guard decompression and archive formats if introduced; disallow nested/unbounded expansion. Stream/chunk where supported; avoid duplicate whole-file copies.
- Parse in a separate worker process with resource limits and restricted network/credentials. For the MVP, do not add a container sandbox platform unless ordinary process isolation and provider controls prove insufficient; before exposing arbitrary complex document parsing broadly, reassess stronger sandboxing.
- Use generated temp locations with restrictive permissions, opaque names and bounded lifetime; clean on success, failure, cancellation and startup sweep. Do not put user filenames or values into paths.
- CSV exports neutralize formula-leading cells (for example values beginning with spreadsheet formula control characters after leading whitespace) or provide a safe non-spreadsheet format; make any altered export semantics clear. Keep source bytes unchanged.
- Return stable safe error codes and request/job IDs. Never echo offending row contents, parser tracebacks, server paths or storage keys.

Browser-side validation improves usability only. FastAPI/storage finalize path independently enforce authentication, actual size, content type/signature, parser limits and authorization.

## 5. Privacy and processing mode

### Browser-only mode

Raw file bytes stay on device unless the user explicitly authorizes transfer. Browser analysis/visualization must not silently send file rows through API requests, telemetry, crash reports or cloud fallback. Browser capabilities are estimates; on insufficient memory, stop and present local alternatives or explicit cloud choice. Never silently switch modes.

Default state is in-memory only. Until Plan 2 chooses otherwise, refresh/close may lose a local session; say so before the user begins. Do not claim cross-device recovery, account history, or server-generated report/model training without cloud persistence. Browser error reporting captures operation code, coarse size bucket/resource class and correlation ID only when safe; no raw values, filenames or data-derived categories. If user later asks for cloud report/training, explain what source/version and result data will transfer, request explicit consent, create a new cloud upload/save operation and preserve the local source state.

### Cloud mode

Explain which raw file, canonical version, result or artifact is transferred, purpose, retention/deletion link and cost before transfer. Consent is scoped to operation/workspace preference only if such preference is explicitly approved, recorded, revocable and shown; a previous unrelated upload is not blanket consent. Store objects privately; access only for the requested operation. Do not use user datasets for general model training, unrelated analytics, or product improvement unless a separate explicit policy and consent authorize it. Persist minimum required data and avoid raw row excerpts in findings/reports/logs.

If a requested operation requires persistence/cloud compute, return a consent-required choice, not an upload side effect. On browser-only to cloud transition, user explicitly approves new transfer, limits and any quote before upload/job submission.

## 6. Token economy and payment security

Billing remains disabled until server quote, provider verification, atomic reservation/settlement, reconciliation and support procedures are reviewed and tested.

- Server quote uses versioned approved prices/discounts and snapshots quantity, currency, total, discount basis and expiry. Browser submits requested quantity; it cannot select price/discount or calculate authoritative amount.
- Payment initiation creates a pending order; wallet credit occurs only after verified provider event for the expected order, amount, currency and account. Verify signature using provider-maintained verification over the raw body and secret from server secret store. Enforce timestamp/replay tolerance if supported, unique provider event ID, order ID and provider payment reference. Never trust browser redirect as payment proof.
- Webhook processing is bounded, schema-validated, HTTPS-only and idempotent. Persist event/order dedupe and financial effects transactionally. Acknowledge only after durable acceptance. Replays/duplicates have no repeated side effects.
- Reserve tokens atomically with available-balance check and row lock/conditional update; enforce nonnegative balance and unique reservation/idempotency. Job receives reservation ID, not price authority. Capture only authorized actual cost; release unused amount; if cost exceeds quote require new approval. Failure/cancel follows approved partial-charge policy; default proposal is release, with no partial charge unless clearly quoted and approved.
- Refunds/chargebacks/admin adjustments create compensating ledger events linked to source. Never edit/delete posted entries. Require privileged role, reason, ticket/reference and audit identity for manual adjustment. Reconcile wallet cache to append-only ledger and provider order/events on a scheduled operational process.
- Token balance does not bypass per-user/workspace concurrent job, memory, time or rate quotas. Secrets, webhook payloads and payment data are not logged or stored beyond necessary provider references.

No provider, prices, discount tiers, expiry, partial billing, refund/chargeback treatment or manual adjustment roles are finalized.

## 7. API security and abuse

MVP FastAPI controls:

- HTTPS; bearer validation; per-resource/workspace authorization on every request; safe CORS allowlist for known web origins.
- If browser auth uses cookies, select SameSite/Secure/HttpOnly behavior and CSRF protection for state-changing routes; if Authorization bearer is used, protect token lifecycle and avoid placing tokens in URLs. Verify actual Next/Supabase SSR flow before choosing exemptions.
- Strict request and response schemas, content types, body limits, safe redirect allowlist, output encoding, parameterized queries, and bounded pagination.
- Rate limits by user, workspace, IP and operation as appropriate; separate expensive training, upload, report and auth limits. Configure per-user concurrent jobs, queue capacity, max job runtime/memory, upload quotas and daily/usage ceilings. Price balance alone is not capacity authorization.
- Deadlines/timeouts, cancellation checks and bounded retry/backoff. Limit outbound network and external URL fetches; avoid SSRF by not fetching user-supplied URLs in MVP. If later required, allowlist schemes/hosts, resolve and block private/link-local destinations at connection time, and defend against DNS rebinding.
- Generic problem responses with stable codes/request IDs; no SQL, stack traces, signed URLs, secrets, paths or raw records.
- Paginate all histories and cap response sizes. API credentials/integrations are not MVP; later store only hashes for verifiable keys, show secret once, scope/expire/revoke, meter use and audit rotation.

No API gateway, distributed rate-limit service or enterprise identity system is required for the MVP unless selected deployment limits demand it.

## 8. ML integrity

ML-validity risk is separate from unauthorized data access. Keep Plan 4 contract: split before fitting preprocessing; learn imputation/encoding/scaling/feature selection on training fold only and reuse fitted state; held-out test does not tune candidate choice. Forecasting uses ordered rolling/expanding origins and avoids future features; clustering uses appropriate unsupervised evidence. Freeze dataset/version, task, target/features, split, metric, algorithm/package version and seeds where meaningful. Compare only compatible evaluation basis, disclose deviations and spread. Undefined/missing metrics remain unavailable with reason. Explanation generation may paraphrase structured facts, never change evidence, score, metric or best-model selection. Test leakage controls and result provenance separately from security tests.

## 9. Job durability and recovery

Persist in PostgreSQL: job ID/workspace/actor, operation and version, immutable input/version refs, config hash, idempotency key, status, attempts, lease/worker claim, cancellation request, stage/progress, timestamps/deadline, reservation ref, output refs and sanitized terminal code. Persist only bounded progress and event metadata. Large payloads and intermediate outputs remain private Storage or controlled temporary storage; in-memory data is transient.

Use one DB-backed durable job/outbox/worker process initially. Claim with atomic lease/compare-and-set, lease expiry and heartbeat; only the current valid lease may commit outputs or terminal state. Enforce terminal states and unique job/output role. Idempotent submit returns same logical job for same key+request hash; same key with changed hash conflicts. Worker retries only transient classes with bounded attempts/backoff. A user retry creates a linked new job and fresh consent/quote if route/config changes; internal attempt retry does not create a second reservation.

Cancellation is a durable request; worker checks between chunks/steps/folds. On timeout/failure/cancel: stop work, delete incomplete outputs idempotently, preserve input, set terminal sanitized reason, release/capture reservation according to approved policy and emit audit event. Startup/reconciler detects expired leases, stale processing, orphan artifacts and unmatched reservations. Recovery must not let stale worker overwrite terminal state. Do not add Kafka/Temporal/distributed orchestration for MVP.

## 10. Logging, monitoring and incident response

Operational logs are not business records. Use structured logs with timestamp, service, severity, request/job/execution correlation ID, operation code, stage, workspace-scoped pseudonymous identifier where justified, duration, resource class and safe error category. Sanitize user-controlled strings against log injection. Never log raw data, filenames unless strictly necessary, access/refresh tokens, cookies, API keys, private keys, payment secrets/signatures, full webhook body, object key, or complete signed URL. Restrict access and define log retention later with owner/privacy review.

Durable audit/business records: auth/security-sensitive events, consent mode and policy version, role/admin changes, upload intent/finalization/deletion, job state/actor, quote/reservation/capture/release/refund/payment event IDs, manual adjustments and data export/download. Record metadata and actor/reason, not file content. Protect audit writes and access; do not expose them as editable user rows.

Before launch monitor and alert on: API/DB/storage readiness failures; auth/authorization denials and anomalous bursts; upload/parser rejection/resource-limit events; queue depth/oldest job/expired leases; worker failures/timeouts/memory exhaustion; job latency and cancellation; storage finalization/deletion/orphan mismatches; payment signature failures/duplicate or unmatched events; wallet-ledger reconciliation differences; error rates and rate-limit spikes. Health endpoints expose sanitized liveness/readiness only. Error reporting must filter request bodies, headers, file contents and secrets. Define on-call owner, severity, response path and incident credential-revocation procedure before public production.

Can wait for growth: full SIEM/SOC, tracing vendor, SLO/error-budget program, anomaly ML and multi-region dashboards. MVP still needs basic logs, metrics, alerts and an operator able to respond.

## 11. Secrets and dependency controls

- Local secrets live in ignored environment files or local secret store. .env.example contains variable names and safe placeholders only; verify .gitignore covers local env, temp files, uploads, artifacts and test data. Never place real credentials in docs/issues/commit history.
- Use distinct development/staging/production Supabase projects and payment webhook secrets. Production secrets injected by deployment secret storage, not image/build args or NEXT_PUBLIC variables. Limit who can read/change each secret.
- Runtime services use separate least-privilege credentials where supported; worker, API and migration/admin roles do not share broad credentials by default. Rotate/revoke compromised secrets immediately and document planned rotation/access review.
- Pin direct/transitive dependency lockfiles; run automated dependency vulnerability checks and secret scanning in CI; review alerts and update patches. Protect CI permissions, forks and deployment environments. Use synthetic fixtures; never production datasets in CI.
- Deployment review includes HTTPS, secure cookies/headers/CORS, debug disabled, safe error handling, restricted admin/database access, backups enabled and tested, resource limits and correct environment config. Exact headers/provider settings belong in implementation and Plan 7.

## 12. Backups, deletion and recovery

Database backup does not by itself recover object storage; map database references and object lifecycle separately. Select the Supabase backup/PITR tier and any independent encrypted backup after choosing workload, plan, region, budget and recovery objectives. Verify what is included/excluded (especially Storage objects and external payment state) from current provider terms. Do not claim a backup exists just because migrations are in Git.

Deletion sequence: revoke access/mark inaccessible; cancel jobs and prevent new references; delete source, derived datasets, reports and model artifacts idempotently; record per-object completion/failure; reconcile orphan/missing objects; then remove or anonymize eligible relational records after approved retention/legal/financial policy. A failed deletion remains inaccessible and retryable, not silently “done.” Account closure revokes sessions and access, cancels work, applies workspace ownership policy, then follows approved deletion/anonymization. Keep financial/audit history only as approved; do not promise immediate erasure from backups or provider caches.

Before launch choose retention periods, legal-hold/financial exceptions, backup tier/region, backup schedule, RPO/RTO, independent backup requirement, restore owner and deletion target. Test restore to an isolated environment; reconcile storage refs, jobs, wallet/ledger, payment orders and secrets; document downtime and rollback. Re-run drills after schema/storage changes. No durations, objectives, region or SLA are invented here.

## 13. Scaling stages

### Stage A — MVP launch

Single region; one API deployment and one worker process initially; Postgres-backed durable jobs; private storage; strict auth/RLS; allowlisted formats and centrally configured byte/shape/time/memory limits; per-workspace/user rate and concurrency caps; token billing only after atomic controls; basic queue/resource/billing alerts; migrations and synthetic security tests. Start with bounded CSV/Excel/JSON; enable PDF only after parser safety/limits and candidate UX are ready. No claim of distributed processing.

### Stage B — growing usage

Scale worker replicas with measured queue depth and safe leases; add backpressure and per-tier quotas; profile memory/time/cost; improve chunked/out-of-core paths; add independent object reconciliation/backup checks, richer audit/metrics and automated restore drills. Introduce queue service or specialized processing only when database queue contention, delivery guarantees or worker throughput justify operational cost. Add stronger parser isolation when exposure/workload warrants it.

### Stage C — production scale

Horizontal workers and queue partitions; dedicated sandboxed execution for higher-risk parsers/expensive user jobs; formal RPO/RTO and tested disaster recovery; regional/data-residency architecture only after customer/legal/provider requirements; organization role policies, key management and compliance controls only when actual product obligations require them. Each addition needs an owner, threat model and measured need; not all are pre-launch requirements.

## 14. MVP security launch checklist

- [ ] Auth token validation, safe session/callback behavior, per-resource authorization and cross-workspace denial tests pass.
- [ ] RLS enabled for every tenant table; least-privilege grants, reviewed functions and same-workspace references tested.
- [ ] Service credentials stay server-side; CI secret scan and production secret separation/rotation path are in place.
- [ ] Private buckets and opaque keys; signed access only after authorization; upload intent/finalization, short expiry and deletion/orphan reconciliation tested.
- [ ] Supported format allowlist, actual-content validation, configured body/shape/parser limits, time/memory bounds and temp cleanup enforced server-side; macros/code never execute.
- [ ] Browser-only request audit confirms no raw upload/telemetry; cloud transfer requires consent; fallback and local refresh loss are clearly handled.
- [ ] Rate/body/page/job/concurrency limits, cancellation/timeouts and safe errors are configured.
- [ ] Job idempotency, lease expiry, stale worker protection, partial-output cleanup and reservation reconciliation tested.
- [ ] Payment launch gate: provider signatures, event dedupe, atomic reservation/capture/release, nonnegative balance, refunds/chargebacks as compensating entries, reconciliation and concurrent/double-delivery tests.
- [ ] ML split/preprocessing/time-order/metric/comparison integrity tests; explanation cannot alter engine facts.
- [ ] Structured data-safe logs, correlation IDs, essential alert routing, operational owner and incident response path ready.
- [ ] Backup scope/tier, retention/deletion policy, restore test and production region/recovery targets explicitly approved.
- [ ] Migration, dependency, secret scanning, deployment config and rollback/recovery checks reviewed.

## 15. Open decisions and dependencies

**Genuine approvals required:** initial format and numeric upload/row/column/page/memory/time limits; browser persistence and consent preference; storage region/provider/cache behavior and signed URL lifetime; PII/data classification and telemetry retention; deletion/financial record policy; backup tier, independent backup, RPO/RTO and restore owner; rate/concurrency quotas and alert/on-call ownership; payment provider, webhook replay semantics, partial charges/refunds/chargebacks/manual adjustment authorization; incident response and customer notification owner.

Plan 2 supplies workspace/RLS, object lifecycle, immutable versions, ledger/reservation and account deletion model; it still needs retention, persistence and backup decisions. Plan 3 supplies auth/workspace authorization, upload intent, API errors, DB job leases/retries, trusted billing and webhook transaction boundaries; production limits and provider are open. Plan 4 supplies untrusted format parsers, router/consent, resource estimates, immutable processing, leakage safeguards and cleanup. Plan 5 supplies server/client boundary, no raw local telemetry, safe downloads, quote rendering and UI consent; it also awaits local persistence decision.

No blocker to this architecture draft. Do not start Plan 7 here.

## Technical references

- Supabase [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [database function privileges](https://supabase.com/docs/guides/database/functions).
- Supabase [private Storage downloads and signed URLs](https://supabase.com/docs/guides/storage/serving/downloads) and [Storage CDN caching behavior](https://supabase.com/docs/guides/storage/cdn/smart-cdn).
- OWASP [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [Webhook Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html), [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), and [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- Supabase [Database Backups](https://supabase.com/docs/guides/platform/backups). Confirm current plan coverage and object-storage scope before selecting production recovery settings.
