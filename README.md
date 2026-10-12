# NUMPA v2

NUMPA is an explainable, largely automated data-to-ML platform for technical and non-technical users. It aims to guide users from data upload and validation through analysis, cleaning, visualization, task-specific ML readiness, model recommendations, evaluation, and downloadable reports.

The product is being designed before full application implementation. The initial scope is to preserve the product workflow and record architecture plans, dependencies, and unresolved decisions.

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

The architecture-first process contains seven plans. Plans 2–7 must be documented and reviewed before full application implementation begins.