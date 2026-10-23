# NUMPA v2

NUMPA is an explainable, largely automated data-to-ML platform for technical and non-technical users. It aims to guide users from data upload and validation through analysis, cleaning, visualization, task-specific ML readiness, model recommendations, evaluation, and downloadable reports.

Architecture-first planning is documented. MVP implementation has started with a browser-local CSV profiling and cleaning workflow; cloud services, identity, and model training remain out of scope for this first slice.

## Product principles

- Automate repetitive work while explaining actions and results in plain language.
- Make important findings visual and processing decisions auditable.
- Validate inputs, handle failures, and protect privacy.
- Adapt readiness checks, recommendations, validation, and metrics to the selected ML task.
- Preview material data transformations and provide a recovery path; never silently change user data in ways that could alter its meaning.
- Treat billing costs, processing thresholds, schemas, and other consequential choices as configurable decisions to be reviewed, not assumptions.

## Planned technology direction

The intended direction is a Next.js and TypeScript frontend, a Python and FastAPI backend, Supabase Auth and PostgreSQL, an abstraction for local/browser and cloud storage, consistent processing contracts, background workers for long-running jobs, structured explainability, and configurable token-based billing. These are architectural intentions, not finalized implementation choices.

## Architecture documentation

- [Product brief](docs/architecture/00-product-brief.md)
- [Product and service workflow](docs/architecture/01-product-and-service-workflow.md)
- [Architecture plans index](docs/architecture/architecture-plans-index.md)

The architecture set contains seven plans. Plans 2–6 remain drafts for review. The first MVP slice proceeds by explicit project direction while consequential backend, billing, privacy-retention, and production decisions remain open.

## MVP implementation

The first usable slice is in [`apps/web`](apps/web/README.md): upload a CSV, inspect inferred field types and quality signals, review an exact cleanup preview, apply changes only to the in-memory working copy, and export a prepared CSV. The browser does not upload or persist the source file. CSV import is capped at 10 MB, 20,000 data rows, and 80 columns. This slice has no account, cloud processing, Excel/PDF support, readiness score, or model training.
