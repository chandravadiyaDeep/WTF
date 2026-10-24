# NUMPA v2

NUMPA is being built as an explainable data workspace that helps users inspect and prepare datasets before ML. The architecture plans are in `docs/architecture/`; design guidance and the supplied dashboard reference are in `design.md`.

## Current product

The current runnable web slice is in [`apps/web`](apps/web/README.md). It provides a browser-local CSV profiling and cleaning workflow, optional Supabase authentication, and opt-in private workspace copies with version metadata. The current scope and cloud setup steps are in the web README.

For a fill-in checklist covering Supabase, local environment setup, auth email redirects, migration deployment, hosting, and which credentials must stay private, see [`docs/launch-setup.md`](docs/launch-setup.md).

## Run

```powershell
cd apps/web
npm ci
npm run dev
```

Visit `http://localhost:3000/demo` for the local workflow. Account and private workspace features require a Supabase project and the migration in `supabase/migrations/`.

## Current state

This is an MVP foundation and is not yet a production SaaS launch. Cloud-backed accounts and storage require project configuration; processing still runs in the browser. Durable API/worker processing, ML features, billing, deployment, deletion/retention operations, backups, and monitoring remain to be built and validated. The chronological handoff is in [`MEMORY.md`](MEMORY.md).
