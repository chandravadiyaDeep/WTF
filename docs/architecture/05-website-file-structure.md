# NUMPA v2 — Proposed Website File Structure

Status: proposed target only. No folders or source files are created by this plan. Add them incrementally in the MVP order.

~~~text
apps/web/
├── package.json                         # Scripts and approved dependencies
├── next.config.ts                       # Next.js config, headers, typed routes
├── tsconfig.json                         # Strict TypeScript and aliases
├── postcss.config.mjs                    # Tailwind integration
├── eslint.config.mjs                     # React/Next/accessibility lint
├── vitest.config.ts                      # Component/unit tests
├── playwright.config.ts                  # E2E browser setup
├── .env.example                           # Names and safe placeholders only
├── public/{brand,illustrations,icons}/    # Static product assets
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root HTML, fonts and providers
│   │   ├── globals.css                   # Tokens, reset and global styles
│   │   ├── not-found.tsx                 # Root not-found
│   │   ├── error.tsx                     # Root recovery boundary
│   │   ├── global-error.tsx              # Safe last-resort boundary
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx                # Public nav/footer
│   │   │   ├── page.tsx                  # Landing
│   │   │   ├── product/page.tsx          # Features
│   │   │   └── pricing/page.tsx          # Approved pricing copy
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # Focused auth shell
│   │   │   ├── login/page.tsx            # Sign-in composition
│   │   │   ├── signup/page.tsx           # Signup composition
│   │   │   └── auth/callback/route.ts    # Server session exchange/redirect
│   │   └── (workspace)/app/
│   │       ├── layout.tsx                # Session guard and app shell
│   │       ├── loading.tsx               # Workspace loading
│   │       ├── error.tsx                 # Workspace recovery
│   │       ├── page.tsx                  # Home dashboard
│   │       ├── upload/page.tsx           # File ingestion
│   │       ├── datasets/page.tsx         # Dataset history
│   │       ├── datasets/[datasetId]/
│   │       │   ├── layout.tsx             # Dataset/version context
│   │       │   ├── page.tsx               # Overview
│   │       │   ├── analysis/page.tsx      # Findings/profile
│   │       │   ├── cleaning/page.tsx      # Cleaning workspace
│   │       │   ├── visualizations/page.tsx # Chart workspace
│   │       │   ├── readiness/page.tsx     # Readiness
│   │       │   └── models/page.tsx        # Candidate/setup
│   │       ├── experiments/[experimentId]/
│   │       │   ├── page.tsx               # Frozen config and progress
│   │       │   └── results/
│   │       │       ├── page.tsx            # Metrics/comparisons
│   │       │       └── [comparisonId]/page.tsx # Comparison detail
│   │       ├── jobs/[jobId]/page.tsx      # Durable job status
│   │       ├── reports/[reportId]/page.tsx # Report preview/download
│   │       └── settings/
│   │           ├── layout.tsx             # Settings navigation
│   │           ├── page.tsx               # Settings home
│   │           ├── account/page.tsx       # Account/session
│   │           ├── billing/page.tsx       # Quote/balance/payment/history
│   │           ├── integrations/page.tsx  # Future integrations
│   │           ├── white-label/page.tsx   # Enterprise capability
│   │           └── developer/page.tsx     # Future API controls
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx            # Desktop primary nav
│   │   │   ├── mobile-nav-drawer.tsx      # Focus-managed mobile nav
│   │   │   ├── workspace-header.tsx       # Workspace/dataset/job/balance/account
│   │   │   ├── dataset-context-selector.tsx # Dataset and version context
│   │   │   ├── workspace-shell.tsx        # Persistent shell composition
│   │   │   ├── breadcrumbs.tsx            # Dataset/service/result trail
│   │   │   └── route-state-announcer.tsx  # Accessible status announcements
│   │   ├── ui/
│   │   │   ├── button.tsx                 # Button variants/focus
│   │   │   ├── form-field.tsx             # Label/help/error association
│   │   │   ├── dialog.tsx                 # Confirmation dialog
│   │   │   ├── drawer.tsx                 # Responsive accessible drawer
│   │   │   ├── tabs.tsx                   # Keyboard tabs
│   │   │   ├── table.tsx                  # Table/overflow primitives
│   │   │   ├── pagination.tsx             # Page/cursor navigation
│   │   │   ├── badge.tsx                  # Text/color status
│   │   │   ├── alert.tsx                  # Inline errors/status
│   │   │   ├── progress.tsx               # Determinate/indeterminate progress
│   │   │   ├── skeleton.tsx               # Loading placeholders
│   │   │   └── empty-state.tsx             # Empty state and next step
│   │   ├── charts/
│   │   │   ├── chart-frame.tsx            # Title, source, version, caption
│   │   │   ├── chart-renderer.tsx          # Approved spec renderer
│   │   │   ├── chart-table-alternative.tsx # Accessible data equivalent
│   │   │   ├── sampling-notice.tsx         # Approximation disclosure
│   │   │   └── chart-empty-state.tsx       # Unsupported/empty explanation
│   │   └── explanations/
│   │       ├── finding-card.tsx            # Finding and plain meaning
│   │       ├── evidence-list.tsx            # Engine evidence refs
│   │       ├── evidence-value.tsx           # Units/precision formatting
│   │       ├── recommendation-panel.tsx     # Action and rationale
│   │       ├── limitation-notice.tsx         # Uncertainty/limitations
│   │       ├── metric-explanation.tsx        # Metric meaning/direction
│   │       ├── technical-term-help.tsx       # Glossary help
│   │       └── before-after-comparison.tsx   # Operation outcome
│   ├── features/
│   │   ├── home/{components,hooks}/         # Dashboard cards and queries
│   │   ├── upload/
│   │   │   ├── components/                  # Dropzone, consent, candidates, progress
│   │   │   ├── parsers/                     # Browser adapter interface
│   │   │   ├── validation/                  # Client preflight hints only
│   │   │   ├── hooks/                       # Upload intent/progress/finalize
│   │   │   └── upload-screen.tsx            # Upload composition
│   │   ├── datasets/{components,hooks,adapters}/ # History/detail/version views
│   │   ├── datasets/dataset-screen.tsx      # Dataset composition
│   │   ├── analysis/{components,hooks,adapters}/ # Profile/findings/column inspector
│   │   ├── analysis/analysis-screen.tsx     # Analysis composition
│   │   ├── cleaning/
│   │   │   ├── components/                  # Inbox, pipeline, preview, confirm, history
│   │   │   ├── components/editors/          # Missing, duplicate, type, encoding, scaling, outlier, feature/text
│   │   │   ├── hooks/                       # Preview/execute/jobs/history
│   │   │   ├── schemas.ts                   # Per-operation form schemas
│   │   │   ├── pipeline-reducer.ts           # Drafts and stale preview invalidation
│   │   │   └── cleaning-screen.tsx           # Cleaning composition
│   │   ├── visualizations/{components,hooks,adapters}/ # Controls/specs/artifacts
│   │   ├── visualizations/visualization-screen.tsx
│   │   ├── readiness/{components,hooks,adapters}/ # Task/dimension/evidence mapping
│   │   ├── readiness/readiness-screen.tsx
│   │   ├── experiments/{components,hooks,adapters}/ # Setup/candidates/training
│   │   ├── experiments/experiment-screen.tsx
│   │   ├── results/{components,hooks,adapters}/ # Metrics/comparison/provenance
│   │   ├── results/results-screen.tsx
│   │   ├── jobs/{components,hooks}/          # Timeline/poll/cancel/retry
│   │   ├── jobs/job-screen.tsx
│   │   ├── reports/{components,hooks}/       # Provenance/download
│   │   ├── reports/report-screen.tsx
│   │   ├── billing/{components,hooks}/       # Balance/quote/order/transactions
│   │   └── settings/{components}/            # Settings nav and capability states
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                    # Base URL/auth/correlation/idempotency/fetch
│   │   │   ├── errors.ts                    # Problem response normalization
│   │   │   ├── schemas.ts                   # Runtime response validation
│   │   │   ├── query-keys.ts                # Workspace/resource/version keys
│   │   │   └── endpoints/
│   │   │       ├── datasets.ts              # Dataset/version/upload
│   │   │       ├── analysis.ts              # Analysis/browser-result save
│   │   │       ├── cleaning.ts              # Preview/execution
│   │   │       ├── visualizations.ts         # Chart specs/artifacts
│   │   │       ├── readiness.ts             # Assessments
│   │   │       ├── experiments.ts            # Experiments/recommend/train
│   │   │       ├── comparisons.ts            # Comparisons
│   │   │       ├── jobs.ts                  # Status/cancel/history
│   │   │       ├── reports.ts               # Report/download
│   │   │       └── billing.ts               # Trusted billing reads/quotes, gated
│   │   ├── auth/{session,redirects}.ts       # SSR session and safe redirects
│   │   ├── supabase/
│   │   │   ├── server.ts                    # Server Auth client
│   │   │   ├── browser.ts                   # Browser Auth client only
│   │   │   └── middleware.ts                # Session refresh integration if needed
│   │   ├── validation/{common,files}.ts      # Client schemas/file preflight
│   │   ├── config/{env,features}.ts          # Validated config and feature gates
│   │   ├── providers/client-providers.tsx    # Query/toast providers
│   │   ├── telemetry/safe-events.ts          # Allowlisted data-minimized events
│   │   └── format/{numbers,dates}.ts         # Units and dates
│   ├── hooks/
│   │   ├── use-current-workspace.ts          # Active workspace selection
│   │   ├── use-current-dataset.ts            # Route dataset/version
│   │   ├── use-network-status.ts             # Offline feedback
│   │   └── use-confirm-navigation.ts         # Guard local work
│   ├── stores/
│   │   └── workspace-ui-store.ts             # Ephemeral UI only; no data/secrets
│   └── types/
│       ├── api.ts                            # Frontend API types
│       ├── dataset.ts                        # Dataset/version types
│       ├── jobs.ts                           # Job types
│       ├── findings.ts                       # Evidence presentation
│       ├── charts.ts                          # Allowed chart specs
│       ├── readiness.ts                      # Pending/dimension states
│       ├── experiments.ts                    # Task/run/metric types
│       └── billing.ts                        # Quote/balance/payment types
└── tests/
    ├── setup.ts                              # RTL/MSW setup
    ├── mocks/{handlers.ts,fixtures/}          # Synthetic contract fixtures
    ├── unit/                                 # Reducers/schemas/errors/query helpers
    ├── integration/                          # API/auth/jobs/billing
    ├── accessibility/                        # Keyboard/axe
    └── e2e/
        ├── auth.spec.ts                      # Auth/protected routes
        ├── upload-analysis.spec.ts           # Upload, analysis, PDF ambiguity
        ├── cleaning.spec.ts                  # Preview/confirmation/versioning
        ├── readiness-models.spec.ts           # Pending and async evaluation
        └── billing.spec.ts                   # Quote/payment pending behavior
~~~

## Responsibility rules

- app owns URL composition, layout, guards, metadata and route loading/error; pages stay thin.
- components/ui owns reusable accessible primitives. charts/explanations present supplied specs and evidence; they do not calculate conclusions.
- features own interactions, forms, feature hooks, adapters and screen composition. Cleaning separates pipeline, operation editors, preview, execution and result/history.
- lib/api owns transport, endpoint paths, auth, idempotency, response parsing, errors and query keys. Unfinalized backend contracts remain unused.
- lib/auth and lib/supabase own session integration. No service-role credential in browser.
- hooks are cross-feature; feature hooks stay local. stores contains only ephemeral cross-route UI state.
- types mirror approved API contracts, not backend business authority. Prefer generated OpenAPI types after Plan 3 stabilizes.
- tests use synthetic data; screenshots supplement behavioral, contract and accessibility tests.

Recommended dependencies: Next.js/React/TypeScript, Supabase SSR/Auth, TanStack Query, Tailwind/Radix, Recharts, Zod, Vitest/RTL, MSW, Playwright and axe checks. Local wrappers improve consistency but require maintenance; Recharts suits standard charts, not necessarily advanced large-data exploration. Polling follows Plan 3 without early streaming infrastructure. Version selection and CI gates are Plan 7 decisions. Create folders only as MVP milestones require.
