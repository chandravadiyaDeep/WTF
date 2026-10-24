# NUMPA — SaaS Setup & Access Handoff

Use this file to track project references and setup status so future work can resume without searching chat history. **Do not put passwords, tokens, or secret keys in this file or any Git-tracked file.** Replace the non-secret placeholders below as you create the services. For secrets, record only where they are stored and whether they are configured.

Last reviewed: 2026-10-24

## Current repository and implementation

- GitHub repository: [chandravadiyaDeep/WTF](https://github.com/chandravadiyaDeep/WTF)
- Working branch: `docs/numpa-v2-architecture`
- Web app: `apps/web`
- Local demo: `http://localhost:3000/demo`
- Supabase migration to apply: `supabase/migrations/20261023000100_saas_foundation.sql`
- Required by the current web app: Supabase project URL and a publishable API key. The web app does **not** need a Supabase secret/service-role key.
- Current web limits: CSV only, up to 10 MiB, 20,000 rows, and 80 columns. Processing stays in the browser; private cloud storage is opt-in.

## Safe project reference checklist

These fields are identifiers or URLs, not passwords. Keep the publishable key out of Git anyway; put it only in `apps/web/.env.local` and the hosting provider's environment-variable settings.

| Item | Development | Staging | Production |
|---|---|---|---|
| Supabase project dashboard URL | `https://supabase.com/dashboard/project/<PROJECT_REF>` | `https://supabase.com/dashboard/project/<PROJECT_REF>` | `https://supabase.com/dashboard/project/<PROJECT_REF>` |
| Project ref | `<fill in>` | `<fill in>` | `<fill in>` |
| Project region | `<fill in>` | `<fill in>` | `<fill in>` |
| Project URL (`https://<ref>.supabase.co`) | `<fill in>` | `<fill in>` | `<fill in>` |
| Publishable key configured in local/host secrets? (yes/no) | `<fill in>` | `<fill in>` | `<fill in>` |
| Migration applied and checked? (yes/no/date) | `<fill in>` | `<fill in>` | `<fill in>` |
| App URL | `http://localhost:3000` | `<fill in>` | `<fill in>` |
| Auth redirect URLs configured? (yes/no) | `<fill in>` | `<fill in>` | `<fill in>` |
| SMTP provider/domain configured? (yes/no) | `<testing only / fill in>` | `<fill in>` | `<fill in>` |
| Hosting project URL | `<not deployed>` | `<fill in>` | `<fill in>` |

## Step 1 — Create Supabase projects

1. Sign in at [Supabase Dashboard](https://supabase.com/dashboard) and create a project for development. Create separate staging and production projects before using real customer data.
2. Choose the region intentionally and record it above. Keep the database and app regions close to reduce latency and document the region for privacy review.
3. Open the project’s **Connect** dialog or **Settings → API Keys**. Copy the Project URL and a `sb_publishable_…` key. Supabase currently recommends publishable keys for browser apps; the older `anon` key is also a client key but should not be confused with a secret key. [Supabase API key guide](https://supabase.com/docs/guides/getting-started/api-keys)
4. Store the URL and publishable key in `apps/web/.env.local` for local development. This file is ignored by Git. The key is designed to be visible to a browser, but database and storage access must remain protected by the migration’s row-level policies.

Local setup in PowerShell from the repository root:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
notepad apps/web/.env.local
```

Set these two values in `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<YOUR_PROJECT_KEY>
```

Do not paste real values into this Markdown file or commit `.env.local`. Never use a `sb_secret_…`, legacy `service_role`, database password, or personal access token in a `NEXT_PUBLIC_` variable.

## Step 2 — Apply the database and storage migration

Use the repository migration as the source of truth. Apply it to development first, verify signup/storage behavior, then apply it to staging and production. Do not reset a remote production database.

Recommended CLI path from the repository root (the CLI login and database password prompts stay local):

```powershell
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref <PROJECT_REF>
npx --yes supabase@latest db push --dry-run
npx --yes supabase@latest db push
npx --yes supabase@latest migration list
```

Review the dry-run target and pending migrations before applying. `db push` applies unapplied migration files and tracks them in the remote migration history. [Supabase migration workflow](https://supabase.com/docs/guides/local-development/cli-workflows)

If you cannot use the CLI, the alternative is the project’s SQL Editor: open the SQL Editor in the correct project, paste the complete contents of `supabase/migrations/20261023000100_saas_foundation.sql`, and run it once. Record that it was applied. Prefer the CLI for ongoing changes so local migration history remains aligned with the project.

The migration creates workspace tables and policies, private storage bucket rules, auth profile/workspace creation, and RPCs for dataset versions. It is designed for a new project; review the SQL before applying it to an existing database with objects of the same names.

## Step 3 — Configure email auth redirects

In **Authentication → URL Configuration** for each Supabase project:

- Set **Site URL** to the app’s canonical URL for that environment.
- Add the exact callback URLs to the allowed redirect list:
  - Development: `http://localhost:3000/auth/callback`
  - Staging: `https://<STAGING_HOST>/auth/callback`
  - Production: `https://<PRODUCTION_HOST>/auth/callback`
- Do not use broad wildcards for production. Supabase uses the Site URL and allowed redirect list for confirmation and password-reset redirects. [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls)

For a quick development check, Supabase’s default mail service is limited and intended for testing. Before inviting or serving real users, configure a custom SMTP provider, verify the sending domain, and set SPF/DKIM/DMARC records. Keep the SMTP password/API token in Supabase’s SMTP settings, not in this repository. [Supabase custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)

## Step 4 — Run and verify the current app

From `apps/web`:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000/demo` to confirm browser-only CSV profiling and cleaning work without an account. Then test the configured cloud flow:

1. Visit `/signup`, create a test account, and confirm the email link returns to `/app`.
2. Sign in and confirm `/app` shows the account/workspace dashboard.
3. Upload a small non-sensitive CSV with **Save private copy** unchecked. Confirm analysis works and the UI says the file stayed in the browser.
4. Upload a test CSV with **Save private copy** checked. Confirm a private history item appears and can be opened again.
5. Preview and apply a cleaning operation, then explicitly choose **Save as v2**. Reopen the dataset and confirm the latest version is shown; the source version should remain in storage/history.
6. Create a second test account/project membership if available and verify it cannot list or download the first account’s files. Review Supabase RLS/storage policies and logs.
7. Test password reset and signout. Keep only synthetic/test data in development.

## Step 5 — Host the web app

The web app is a Next.js application rooted at `apps/web`. Hosting is not configured yet. One straightforward option is [Vercel](https://vercel.com/new): import the GitHub repository, set the project root directory to `apps/web`, and deploy a preview first. See [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

Configure these environment variables separately in Development/Preview and Production through the hosting dashboard; do not place values in GitHub source files:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Add the deployed host’s `/auth/callback` to the matching Supabase project’s allowed redirect URLs and set that project’s Site URL. Redeploy after changing hosting environment variables. Add the production domain only after preview signup, reset, storage access, and logout work.

If using GitHub Actions or another host later, use its encrypted secrets/environment-variable store. This web CI workflow only builds and lints; it does not need Supabase credentials.

## Secrets — what goes where

| Value | Where it belongs | Put it in this file or chat? |
|---|---|---|
| Supabase project ref, dashboard URL, app domain, region | Checklist above | Yes; these are identifiers/URLs. |
| Supabase project URL | `apps/web/.env.local`; hosting env settings | Prefer record only the dashboard link here. Do not commit the configured env file. |
| `sb_publishable_…` key (or legacy `anon` key) | Local `.env.local` and hosting env settings | No need to paste it here. It is a client key, but keep project config out of Git. |
| Supabase secret key (`sb_secret_…`) / legacy `service_role` | Only a trusted server/worker secret manager, after backend work requires it | **Never** commit, put in Markdown, or prefix with `NEXT_PUBLIC_`. Not needed by the current app. |
| Database password, Supabase access token, SMTP password/token | Provider’s secure prompt/settings or secret manager | **Never** commit, put in Markdown, or send in chat. |
| Stripe/payment secrets and webhook signing secret | Billing provider/host secret manager, only after billing is implemented | **Never** commit, put in Markdown, or send in chat. |

If a secret is accidentally added to Git or shared, rotate/revoke it in its provider immediately. Deleting the line from a later commit does not remove it from Git history.

## Remaining service information (collect only when that work starts)

These services do not exist in the current implementation, so no keys are needed for them yet. When building them, record provider names, dashboard links, non-secret project identifiers, service URLs, region, and setup status here. Put credentials only in the provider/host’s secret manager.

- API service: provider, project/dashboard link, service URL, region, deployment status.
- Durable worker and queue: provider, dashboard/project link, queue type, region, retry/retention settings.
- Billing: provider account link, test/live mode, product/price IDs (identifiers only), webhook endpoint and status. Never store secret signing values here.
- Monitoring/backups: provider links, alert destination/owner, retention window, tested restore date, operational owner.
- Legal/product launch: production domain, privacy policy/terms links, data retention/deletion policy, supported regions and support contact.

Do not create or send billing, API-worker, or monitoring credentials until their code paths and security boundaries are implemented. Use separate development/staging/production provider projects and credentials.

## What to send me when setup is ready

Update this checklist with the **project ref, dashboard URL, region, app URL, and whether the migration/auth redirects/SMTP are configured**. Put the Project URL and publishable key in `apps/web/.env.local` on the shared workspace (or the hosting environment settings). Tell me that the values are set; do not paste any secret keys, database passwords, SMTP tokens, access tokens, or service-role keys into the Markdown file or chat. Then I can continue by validating the migration-backed account and storage flows and implementing the API/worker stages.
