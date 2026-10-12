# NUMPA v2 — Plan 2: Database and Storage Architecture

## Status and recommendation

**Status:** Draft for review. This is an architecture proposal, not an approved physical schema. It establishes no migrations, code, packages, prices, limits, or retention periods.

**Recommendation:** Supabase PostgreSQL for structured state, Supabase Auth for identity, and private Supabase Storage as the initial cloud object store. Every user-owned record belongs to a workspace. Begin with personal workspaces and retain a membership model that supports later organization workspaces. Browser-only file bytes remain on-device and need no cloud dataset, version, or object row unless the user explicitly chooses to save cloud history or processing. Store immutable input/configuration snapshots and provenance references so runs remain explainable.

Use UUIDs for application keys; Auth user UUIDs for identities; UTC timestamps; integer byte counts; constrained lifecycle/status values; and bounded, versioned JSONB only for variable configuration/evidence. Every tenant record carries workspace_id for direct RLS enforcement. Use composite uniqueness/foreign keys on (workspace_id,id) where needed to prevent cross-workspace references. created_by is attribution, not ownership. Full table/column inventory is in the [data dictionary](../database/data-dictionary.md).

## 1. Storage boundaries

| System | Responsibility | Not responsible for |
|---|---|---|
| Supabase Auth | Authentication credentials, identity and session lifecycle. profiles.user_id maps one-to-one to auth.users.id. | Passwords, refresh tokens, or copied credentials in app tables. |
| PostgreSQL | Workspace/access state; dataset and file metadata; versions and lineage; run/job state; findings/evidence; metrics; artifact references; audit events; billing configuration snapshots, wallet, reservations, and ledger. | Raw files, dataframes, PDFs, images, model binaries, or unbounded logs. |
| Supabase Storage | Initial private object store for cloud uploads, canonical/cleaned dataset versions, generated reports/charts, and retained model artifacts. | Public data buckets or authorization based on an opaque path alone. |
| Browser local | User-selected local processing, transient data in memory, optional explicit device-local persistence. | Account history/recovery claims or silent cloud upload. |
| Job infrastructure | Replaceable queue/worker executes tasks. PostgreSQL records durable job identity, status, attempts, and output references. | Queue as sole source of truth or large payloads in job rows. |

Supabase Storage private buckets are the recommended initial approach; avoid adding another storage vendor until requirements prove necessary. Use a small number of private buckets separated by lifecycle/trust boundary if useful, never a bucket per user. Generate opaque object keys from workspace/dataset/version/asset UUIDs, not filenames or personal data. Metadata records bucket, key, size, MIME type, checksum, and state.

A trusted API creates an upload intent, authorizes workspace access, issues a short-lived signed URL, verifies upload and content, then finalizes the asset/version row. A signed URL is a bearer credential: expire quickly, avoid logging it, never embed it in reports, and issue only after checking current membership. Storage policies and RLS must both enforce workspace access. Never expose service-role keys to clients. Pending/abandoned uploads are cleaned by an idempotent reconciliation job. Deletion first revokes access and marks pending deletion, then deletes objects asynchronously and records completion; a sweep finds orphaned objects.

### Browser-only behavior

By default, browser-only bytes and working state create no cloud file/dataset rows. Session-only memory cannot survive refresh; optional IndexedDB persistence can survive some refreshes but may be cleared, evicted, or lost with the device/profile. Do not promise recovery beyond what the browser stores. Cloud account history, cross-device recovery, and server-side report generation requiring the raw file are unavailable unless the user explicitly saves/uploads it. A local report can be generated and downloaded. Metadata/results may be saved without raw bytes only with clear disclosure that profiles and findings may reveal sensitive facts. Failure before local persistence may be unrecoverable. Plan 6 and product review must choose session-only vs optional IndexedDB behavior.

### Auth and account lifecycle

profiles references auth.users.id and holds only minimal preferences/lifecycle fields. A trusted Auth lifecycle process provisions it; users cannot set user_id or role. Auth deletion must not cascade directly into financial/audit history. Account closure blocks new work, revokes credentials, cancels jobs, then follows approved deletion/anonymization and retention policy. Workspace ownership transfer/deletion must be explicit and never leave an orphaned accessible workspace.

## 2. Candidate model and workflow support

All tenant rows have workspace_id. Main MVP families:

- Identity/access: profiles, workspaces, workspace_members.
- Ingestion: datasets, dataset_assets, dataset_versions.
- Work/audit: processing_jobs, job_attempts, analysis_runs, findings, finding_evidence, pipeline_definitions, pipeline_versions, pipeline_steps, cleaning_executions.
- Visualization/artifacts: visualization_specs, artifacts, reports.
- ML: readiness_profiles, readiness_profile_versions, readiness_assessments, readiness_dimension_scores, experiments, algorithm_recommendations, training_runs, evaluation_metrics, model_comparisons.
- Billing when paid execution launches: token_wallets, token_ledger_entries, operation_prices, discount_rules, payment_orders, token_reservations, usage_events.
- Later: organizations if distinct from org workspaces, API credentials/metering, integrations/webhooks, white-label config, subscriptions/entitlements, feedback.

A dataset is a logical source or structured dataset; datasets.kind distinguishes them. An uploaded PDF is a source document asset. Extracted table candidates are child datasets with extraction status and metadata. Multiple tables become independent candidates; failed/ambiguous extraction is represented as status/findings, not a fake table. A canonical tabular version exists only after selection/conversion. A cleaned version is immutable, points to its parent version and cleaning execution, and never overwrites the source.

| Plan 1 workflow | Data representation |
|---|---|
| Upload/validation | Cloud: dataset, private asset, version metadata and ingestion job/findings. Browser: local state, no cloud row by default. |
| Analysis | analysis_runs, bounded profile, findings/evidence; local result may remain local or be explicitly saved. |
| Cleaning | versioned pipeline/steps, cleaning execution, input/output version refs, step outcomes and bounded before/after summaries. |
| Visualization | specification and optional artifact metadata; transient charts need no row. |
| Readiness | versioned profile and assessment snapshot with dimension scores/evidence. |
| Recommend four | recommendation snapshots with rationale, assumptions, model family/version and rank; fewer than four allowed when appropriate. |
| Train/evaluate | experiment, training run, protocol/split metadata, metrics and exact dataset/config versions. Keep train/validation/test roles distinct; avoid raw split/prediction storage by default. |
| Compare/report | comparison references exact runs/metric basis; report references source runs, dataset versions and template plus private artifact. |

Persist profile summaries, not raw rows. Use typed columns and foreign keys for authorization, lifecycle, and joins; bounded JSONB for variable parameters and evidence. Move large payloads to Storage. Config and result rows are immutable once published/completed. Changes create a new pipeline/profile version; completed assessments retain the version they used.

## 3. ER diagram

```mermaid
erDiagram
  AUTH_USERS ||--o| PROFILES : maps
  PROFILES ||--o{ WORKSPACE_MEMBERS : joins
  WORKSPACES ||--|{ WORKSPACE_MEMBERS : grants
  WORKSPACES ||--o{ DATASETS : owns
  DATASETS ||--o{ DATASET_ASSETS : source
  DATASETS ||--o{ DATASET_VERSIONS : versions
  DATASET_VERSIONS o|--o{ DATASET_VERSIONS : lineage
  DATASET_VERSIONS ||--o{ ANALYSIS_RUNS : analyzed
  PIPELINE_DEFINITIONS ||--o{ PIPELINE_VERSIONS : versions
  PIPELINE_VERSIONS ||--|{ PIPELINE_STEPS : defines
  PIPELINE_VERSIONS ||--o{ CLEANING_EXECUTIONS : executes
  DATASET_VERSIONS ||--o{ CLEANING_EXECUTIONS : input
  PROCESSING_JOBS ||--o{ JOB_ATTEMPTS : attempts
  PROCESSING_JOBS o|--o{ ANALYSIS_RUNS : schedules
  PROCESSING_JOBS o|--o{ CLEANING_EXECUTIONS : schedules
  ANALYSIS_RUNS ||--o{ FINDINGS : detects
  FINDINGS ||--o{ FINDING_EVIDENCE : supported
  WORKSPACES ||--o{ READINESS_PROFILE_VERSIONS : configures
  READINESS_PROFILE_VERSIONS ||--o{ READINESS_ASSESSMENTS : snapshots
  READINESS_ASSESSMENTS ||--o{ READINESS_DIMENSION_SCORES : scores
  EXPERIMENTS ||--o{ ALGORITHM_RECOMMENDATIONS : recommends
  EXPERIMENTS ||--o{ TRAINING_RUNS : runs
  TRAINING_RUNS ||--o{ EVALUATION_METRICS : measures
  MODEL_COMPARISONS }o--o{ TRAINING_RUNS : compares
  REPORTS }o--|| ARTIFACTS : file
  WORKSPACES ||--o{ TOKEN_WALLETS : owns
  TOKEN_WALLETS ||--o{ TOKEN_LEDGER_ENTRIES : ledger
  TOKEN_RESERVATIONS ||--o{ TOKEN_LEDGER_ENTRIES : settles
  PROCESSING_JOBS o|--o{ TOKEN_RESERVATIONS : reserves
```

The diagram omits later-phase tables and some same-workspace FKs for legibility. Avoid circular FKs. For ledger source integrity, use typed nullable FKs with a check that exactly one applies or a normalized source table; do not rely solely on unvalidated entity_type/entity_id pairs.

## 4. Ownership and provenance

| Records | Tenant and actor | Required provenance |
|---|---|---|
| Workspace | workspace is root; personal owner/org scope | created_by |
| Membership | workspace_id + member user_id | invited_by |
| Dataset/assets/versions | workspace_id; created_by is actor | dataset, asset, parent version, object key |
| Runs/findings/evidence | same workspace as run | exact dataset version, job, config version |
| Pipeline | workspace; editor attribution | definition → immutable version → ordered steps |
| Cleaning | workspace; requester/worker attribution | input/output versions, pipeline version, job |
| Visualization/report/artifact | workspace; requester | source version/run and artifact |
| Readiness | workspace; requester | exact profile version and dataset version |
| Experiment/training/metrics/compare | workspace; requester/worker | dataset version, protocol/config snapshot, run refs |
| Jobs/attempts/events | workspace; requester/service | idempotency key and operation target |
| Wallet/ledger/payment/reservation/usage | workspace billing scope; trusted actor | job, quote/price snapshot, payment/source, reservation |
| Later API/integration | workspace; credential creator | hashed key or encrypted secret reference |

Do not repeat owner_user_id on every child row. Membership determines access; created_by is attribution only. Include workspace_id on children for direct RLS and composite same-tenant FKs, a deliberate security/performance duplication.

## 5. Token ledger and concurrency

The wallet is a cached balance for display/locking, never the billing truth. Append-only ledger entries contain signed integer token delta, event type, source FK, unique idempotency key, trusted actor, timestamp, and quote/price snapshot. Posted entries are never edited/deleted; corrections use compensating entries. Store money as integer minor units plus ISO currency. Version operation prices and quantity discount tiers with effective dates. A quote snapshots quantity, tier, base/discount/final amount and currency; later price changes affect only new quotes.

Reservation lifecycle: estimate → reserve → execute → capture actual authorized cost and release unused amount on success; release on failure/cancel unless reviewed policy permits charging completed partial work. Any charge above authorization requires new user consent. Reservation states include reserved, partially captured, captured, released, and expired only if policy allows. Unique payment provider/event IDs prevent duplicate webhook credits. Refunds/chargebacks create compensating ledger movements. Retries share one logical job/reservation; attempts do not independently charge. Unique reservation transition/idempotency keys prevent repeated capture.

In one transaction, lock wallet or use serializable/atomic SQL routine; verify available balance, insert reservation and ledger hold, update cache; enforce nonnegative result. On terminal job transition, capture/release, post unique ledger movement, update wallet and reservation atomically. Payment verification and operation-price writes are backend-only. Reconcile cached balance against ledger and create an audited adjustment only after investigation. Discount threshold, prices, token costs, expiration, partial billing, reservation timeout, and chargeback policy are undecided.

## 6. Jobs, RLS, and security

processing_jobs stores workspace, operation, target refs, requester, status, bounded progress, idempotency key, request/config hash, cancel request, timestamps and sanitized terminal error. job_attempts stores attempt number, lease/worker, timings and sanitized outcome. Optional job_events is append-only for significant transitions. Payloads/files remain in private storage or a protected payload store. Unique (workspace_id,idempotency_key), lease/compare-and-set claims, output uniqueness by job+role, and terminal-state immutability make retries safe. Cancellation is a request until acknowledged. Plan 3 selects queue, lease, outbox and event mechanism.

All exposed tenant tables enable RLS and check active workspace membership/role using a reviewed helper with fixed search_path. Personal owner is an owner membership, allowing the same policy to extend to organizations. Revoke broad grants; review views/functions for RLS bypass.

| Table group | Read | Client writes | Trusted backend |
|---|---|---|---|
| Profiles | own | safe preferences only | Auth lifecycle |
| Workspaces/members | members | owner/admin membership operations; no role escalation | invite/owner invariants |
| Datasets/files/versions | authorized members | create metadata/upload intent; draft metadata only | verify/finalize/delete |
| Pipelines/readiness profiles | members | draft editor changes only | freeze versions |
| Jobs/runs/results/metrics | members | request work only | worker state/results |
| Artifacts/reports | members, with authorized download | request generation | sign URLs/write/delete |
| Audit | authorized admins/support | no edit/delete | privileged events |
| Wallet/ledger/prices/payments/reservations/usage | scoped history/read | no financial writes | trusted billing service only |
| Future credentials/integrations | admin or credential owner; never secret plaintext | create/revoke request | hashes/encrypted secret refs |

Server service-role credentials bypass RLS and belong only in backend secret storage, never browser or logs; rotate and audit use. API authorization must validate workspace role and each referenced object. Storage policies complement RLS by checking membership/object metadata association. A private DB row must never map to public URL. Signed URLs are short-lived bearer credentials.

Minimize profile data, log no raw file contents/secrets/signed URLs, sanitize worker errors, and bound evidence/result JSON. Deletion requests block access and new work, cancel active jobs, revoke signing, remove objects asynchronously, then purge/anonymize DB records by approved retention rules. Keep required billing/audit records only for reviewed purposes/durations.

## 7. Lifecycle, reliability, and retention

Retention durations, legal holds, region, backup windows, deletion SLA and recovery objectives remain undecided; see [storage matrix](../database/storage-and-retention-matrix.md).

- Upload: pending intent → private upload → format/size/content validation → verified metadata/version. DB and object storage do not share a transaction, so reconcile pending rows and orphan objects.
- Browser-only: local memory or explicitly persistent browser storage. Refresh/device recovery only when bytes/config remain locally; no account recovery promise.
- Cloud dataset: private object and immutable version metadata/checksum.
- Cleaning: write a new immutable output object/version and lineage; preserve source until approved retention deletion.
- Analysis/readiness: save bounded results and exact input/config snapshot; no raw per-row outputs by default.
- Training: save config/protocol/results; retain model binary only when supported and user-visible.
- Report: provenance row plus private file; local report download need not be stored server side.
- Failed/cancelled work: sanitized terminal record, idempotent partial-output cleanup, honest status and billing policy.
- Deletion: logical revoke first, physical deletion asynchronously, status tracking, orphan sweep; dependent lineage deletion explained before action.

Use FKs/checks/unique constraints and transactions for integrity. Index workspace+created_at, common FK columns, active status/queue claims, and idempotency keys; add JSON indexes only for demonstrated queries. Bound JSONB and metadata sizes. Use reviewed forward migrations, staging validation, backup and rollback/backfill plans. Plan 6/7 must define backup/PITR tier, RPO/RTO and restore drills. Plan 3 defines reliable queue dispatch/outbox and reconciliation jobs.

## 8. MVP and later phases

| Area | MVP | Later |
|---|---|---|
| Access | Auth mapping, profile, personal workspace, membership table | Organizations, invites, enterprise SSO/policies |
| Ingestion | Cloud object metadata/versioning and browser-local path; choose initial CSV/Excel/JSON subset after Plan 4 | PDF extraction candidates, connectors, streaming large files |
| Analysis/cleaning | Runs/findings/evidence, versioned pipeline/execution lineage | Shared templates/collaborative approvals |
| Visualization/export | Specs and optional private artifacts/reports | Scheduled/rich exports |
| ML | Profile snapshots, readiness, experiments, recommendations, training/evaluation metadata | Model registry/deployment |
| Jobs/audit | Durable job/attempt and critical audit state | Advanced scheduling/analytics |
| Billing | Model records; launch paid work only after atomic ledger/payment/reconciliation | Subscriptions and entitlements additive to token ledger |
| Integrations | None required | Hashed API keys, usage metering, encrypted provider secrets, webhooks, white-label |

Later tables: api_credentials (key hash/prefix/scopes/revocation), api_usage_events, integration_connections (encrypted secret reference), webhook_endpoints/deliveries (sanitized attempts), white_label_settings (workspace config), subscriptions/entitlements, feedback. Never store plaintext API keys or provider secrets.

## 9. Plan dependencies and review decisions

Plan 2 consumes Plan 1's workflow, task families, file-format distinctions, privacy direction, explainability, user control, recoverability and token billing intent. Plan 3 must define API/service-role boundaries, upload and signed-URL flows, auth profile provisioning, atomic billing routines, queue/lease/outbox, retry/cancel semantics, deletion workers, limits and observability.

Decisions requiring review before implementation:

1. Privacy default: recommendation is no persisted browser results unless the user explicitly saves them; saved metadata can reveal sensitive facts.
2. Cloud consent: choose per-upload/per-operation confirmation vs a saved workspace preference.
3. Retention durations for source/derived files, models, reports, failed uploads, audit/billing and backups; deletion SLA and legal holds.
4. First release personal workspaces only or team invitations. Recommendation: personal UI with membership schema.
5. Whether MVP offers IndexedDB persistence or session-only local work.
6. Paid partial completion, reservation expiry, promo token expiration, refunds/chargebacks.
7. File/result limits, storage region and whether Supabase Storage/backups satisfy needs.
8. Whether to retain trained model binaries, predictions, and test outputs.
9. If/how account deletion must preserve financial records.

These do not block this draft but require approval before relevant implementation. Do not start Plan 3 until this plan is reviewed and approved.
