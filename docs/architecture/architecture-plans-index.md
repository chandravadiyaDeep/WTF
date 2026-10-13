# NUMPA v2 — Architecture Plans Index

## Purpose

Project handoff record: [MEMORY.md](../../MEMORY.md) summarizes current architecture, progress, open decisions and how to maintain the activity history.

This index tracks the seven architecture plans required before full application implementation. Plan 1 is established conceptually and documented in [00-product-brief.md](00-product-brief.md) and [01-product-and-service-workflow.md](01-product-and-service-workflow.md). Plans 2–6 are drafted for review. Plan 7 remains pending. “Known requirements” record stated constraints; unresolved choices are not approvals.

## Plan sequence

| # | Plan | Status | Key dependencies |
|---|---|---|---|
| 1 | Product and Service Workflow | Concept established; documented | Product direction; informs Plans 2–7 |
| 2 | Database and Storage Architecture | Drafted for review | Plan 1 workflows; Plan 6 security/privacy feedback; informs Plans 3–5 |
| 3 | Backend Architecture | Drafted for review | Plans 1–2; Plan 4 processing contracts; coordinates API, identity, jobs, integrations, and billing |
| 4 | Processing Engine Architecture | Drafted for review | Plans 1–3; defines shared operation contracts consumed by browser/cloud engines and workers |
| 5 | Frontend Architecture and complete folder/file structure | Drafted for review | Plans 1–4; Plan 6 security/privacy feedback and Plan 7 implementation gates |
| 6 | Security, Privacy, Reliability, and Scaling | Drafted for review | Plans 1–5; informs Plan 7 launch gates and earlier plan revisions |
| 7 | Implementation, Migration, Testing, and Deployment Plan | Pending | Plans 1–6; sequences delivery and operational readiness |

The order is a planning sequence, not a claim that concerns can be considered in isolation. Security, privacy, reliability, and scaling constraints should shape each earlier plan as they are developed.

## Plan 1 — Product and Service Workflow

**Known requirements:** cover upload and validation; automated analysis; data-quality detection and explainable cleaning/preprocessing; visualizations; task-specific ML-readiness assessment; four suitable algorithm candidates; supported training; valid evaluation; comparisons and downloadable reports. Support the eventual task families of classification, regression, time-series forecasting, and clustering. Explain in accessible language, retain meaningful processing history, respect privacy, and preserve user control over material transformations.

**Documentation:** [01-product-and-service-workflow.md](01-product-and-service-workflow.md).

**Open decisions:** detailed journey states, project/session lifecycle, user approval points, supported formats and limits, accessibility targets, and measurable product outcomes.

## Plan 2 — Database and Storage Architecture

**Known requirements:** Supabase Auth and PostgreSQL are intended directions. The architecture uses workspace-scoped relational state, private object storage for cloud data/artifacts, a no-fake-object browser-local path, immutable dataset/config/result provenance, durable job metadata, and a ledger/reservation model for token billing. PDF documents are distinct from extracted canonical tables. The proposal recommends private Supabase Storage as the initial object store and personal workspaces with a future membership path.

**Documentation:**
- [02-data-and-storage-architecture.md](02-data-and-storage-architecture.md)
- [Data dictionary](../database/data-dictionary.md)
- [Storage and retention matrix](../database/storage-and-retention-matrix.md)

**Open decisions requiring review:** browser persistence and metadata privacy defaults; cloud-consent model; retention, deletion, legal holds and backup objectives; personal-only launch vs team invitations; paid partial completion, reservation expiry, promo expiry and chargebacks; file/result limits and storage region/provider fit; model/prediction retention; account-deletion treatment of financial records. Pricing values and thresholds remain intentionally unset.

**Dependencies:** Plan 1 workflow, task families, privacy principles, explainability, recovery and billing intent. Plan 6 must review threat model, data minimization, retention, access and recovery assumptions. Plan 3 must define API/service-role boundaries, profile provisioning, upload/signed-URL/deletion flows, atomic billing routines, queue/lease/outbox, retries, cancellation and reconciliation.

**Status rule:** this is a draft only. Do not start Plan 3 until the user reviews and approves Plan 2.

## Plan 3 — Backend Architecture

**Status:** Drafted for review.

**Documentation:** [03-backend-architecture.md](03-backend-architecture.md).

**Known requirements:** Python/FastAPI modular backend, Supabase Auth and PostgreSQL, private object storage, separated API/service/repository/worker responsibilities, secure workspace authorization, browser/cloud processing contract, durable idempotent jobs, explainable task-aware workflows, and protected token billing.

**Open decisions:** exact JWT verification and database adapter; browser persistence and client-result saving policy; initial formats/resource limits and sync/async cutoffs; payment provider and partial billing/refund/expiry rules; RPO/RTO, logs/rate limits/alerts.

**Dependencies:** Plan 2 workspace, RLS, dataset/version, job, artifact, and ledger model; Plan 4 operation contracts, parsers, limits, readiness/model registry and evaluation protocols.

## Plan 4 — Processing Engine Architecture

**Status:** Drafted for review.

**Documentation:** [04-processing-engine-architecture.md](04-processing-engine-architecture.md).

**Known requirements:** shared versioned operation/result contracts; format-aware ingestion including PDF table candidates; canonical dataset lineage; explicit browser/cloud routing; explainable data-aware profiling and cleaning; task-specific readiness/recommendations; leakage-safe training/evaluation; purposeful visualizations; bounded resource/cost/job behavior.

**Open decisions:** first format/parser set and limits; browser capability/persistence policy; PDF extraction/OCR capability and ambiguity UX; readiness weights/thresholds; supported model/version roster and metric defaults; compute budgets and cost-estimation inputs. Numeric thresholds/prices remain unapproved.

**Dependencies:** Plan 2 dataset/version/storage/job/artifact/ledger model; Plan 3 APIs, authorization, worker lifecycle, consent, billing and service boundaries. Plan 5 consumes operation, chart, finding and job status contracts.

## Plan 5 — Frontend Architecture and complete folder/file structure

**Status:** Drafted for review.

**Documentation:**
- [05-frontend-architecture.md](05-frontend-architecture.md)
- [05-website-file-structure.md](05-website-file-structure.md)

**Known requirements:** Next.js and TypeScript are the intended direction. Provide persistent navigation for Home, Data Analysis, Data Preprocessing / Cleaning, Data Visualization, ML Readiness, ML Algorithms & Results, and Settings. Settings should eventually include Account, Plans & Billing, Integrations (including Zapier), White Label, and API & Developer settings. Keep business logic out of UI components; make explanations, previews, progress, and results understandable.

**Open decisions:** API contracts for dataset/history and experiment listing/details; browser refresh persistence; upload limits/cloud-consent UX; PDF candidate response; payment provider and MVP billing launch; package versions and CI are deferred to Plan 7.

**Dependencies:** stable user journeys and contracts from Plans 1–4; security and privacy requirements in Plan 6.

## Plan 6 — Security, Privacy, Reliability, and Scaling

**Status:** Drafted for review.

**Documentation:** [06-security-privacy-reliability-scaling.md](06-security-privacy-reliability-scaling.md).

**Known requirements:** privacy-aware browser/cloud processing, authorized cloud processing, secret hygiene, reliable validation and error handling, safe long-running work, auditability, and recovery. Avoid silent material data changes. Cost-sensitive operations need safe token reservation and reconciliation.

**Open decisions:** initial format/resource limits; browser persistence and consent preference; storage region/cache and signed URL lifetime; data classification/log retention; deletion policy; backup tier/RPO/RTO; quotas/on-call ownership; payment provider and refund/partial-charge rules; incident response owner. No compliance claims are implied.

**Dependencies:** informed by Plans 1–5 and must feed back into them.

## Plan 7 — Implementation, Migration, Testing, and Deployment Plan

**Known requirements:** architecture plans must be reviewed before full application implementation. Future code should use type hints, understandable naming, validation, error handling, and tests for important logic. Maintain architecture documents as approved requirements change. Do not fabricate evaluation results; prevent data leakage.

**Open decisions:** milestones and acceptance criteria, deployment environments, CI/CD, migration sequencing, test strategy and data fixtures, model evaluation checks, release/rollback process, operational ownership, and initial supported product slice.

**Dependencies:** reviewed Plans 1–6; final plan for sequencing the approved architecture into delivery.

## Cross-plan constraints

- Treat Next.js/TypeScript, Python/FastAPI, Supabase Auth/PostgreSQL, storage abstraction, browser/cloud processing, workers, explainability, and token-based billing as intended directions pending design review.
- Do not invent finalized database schemas, pricing values, processing thresholds, or readiness scores.
- Support distinct file handling; PDF extraction may be required before structured analysis.
- Preserve user data and provide preview, transparency, audit history, and recovery for material transformations.
- Make readiness, recommendations, validation, and metrics specific to the ML task; prevent evaluation leakage.
- Keep secrets out of source control. Future environment examples must contain names and safe placeholders only.

## Review and change tracking

Each plan should identify its scope, assumptions, options considered, decisions, consequences, unresolved questions, and dependencies. Record approved decisions in the relevant plan and update this index when a plan's status or dependency changes. Do not start full application implementation until Plans 2–7 have been completed and reviewed.
