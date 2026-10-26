# NUMPA — Supabase Development Setup

Last reviewed: 2026-10-24

This document tracks Supabase setup without storing credentials. Never put passwords, access tokens, publishable keys, secret/service-role keys, or SMTP credentials in this file or another tracked file.

## Current project record

| Environment | Name | Project ref | Region | Dashboard |
|---|---|---|---|---|
| Development | `numpa-v2-dev` | `xjkulfyetcvuuhxhuevp` | Not provided | [Open Supabase project](https://supabase.com/dashboard/project/xjkulfyetcvuuhxhuevp) |

- Repository: [chandravadiyaDeep/WTF](https://github.com/chandravadiyaDeep/WTF), branch `docs/numpa-v2-architecture`.
- Web application: `apps/web`; local URL `http://localhost:3000`.
- Current web variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Local `apps/web/.env.local`: absent at review time; root `.gitignore` contains an explicit ignore rule. The workspace snapshot has no `.git` metadata, so `git check-ignore` could not be run here.
- Canonical Project URL: `https://xjkulfyetcvuuhxhuevp.supabase.co` (provided in the setup request; this is the project URL, with no `/rest/v1/` suffix).
- Supabase CLI link: none (`supabase/.temp/project-ref` absent). CLI and Docker are unavailable in this workspace. No hosted project was queried.
- Migration status: **not applied or remotely verified**. The baseline and hardening migrations are pending as local source files. Deployment date: none.
- Storage: SQL defines a private `numpa-private` bucket and workspace-scoped object policies; hosted bucket/policies are not deployed or verified.
- Region remains unreported. Project name/reference/URL/dashboard URL are now recorded from the supplied development details.
- Local `apps/web/.env.local`: configured with the supplied Project URL; publishable key is blank because the actual key is not available in the context I can access. Do not copy a placeholder key into this file.

## What the current integration does

The web app initializes Supabase SSR browser/server clients and refreshes sessions through `proxy.ts`. It has signup, login, email callback, password reset/update, logout, and a protected `/app` workspace view. The app can analyze and clean CSVs locally in the browser. Upload to the private bucket happens only after the user selects **Save private copy**; new cleaned versions are uploaded only after the user chooses **Save as v2**. Current limits are 10 MiB, 20,000 rows, and 80 columns.

The migration creates profiles, a personal workspace and membership for each new auth user, datasets, immutable dataset versions, processing jobs, and findings. It enables RLS and defines storage policies. Team sharing is not part of this setup; access should remain scoped to the user's workspace membership. No backend worker or service-role code is needed for the current client flow.

## Migration preview — pending changes

Apply in this order to a **new development project**:

1. `supabase/migrations/20261023000100_saas_foundation.sql` — creates workspace/data tables and indexes, ownership and membership helper functions, initial auth-user workspace trigger, dataset version and upload-failure RPCs, RLS policies, grants, and private storage bucket/policies (10 MiB limit).
2. `supabase/migrations/20261024000100_supabase_access_hardening.sql` — narrows user update grants to profile display name/workspace name; tightens initial dataset/job inserts; and validates dataset version metadata, allowed summary fields, storage object paths, sizes, counts, and version state before a version can be recorded.

These are additive migrations for the application schema; they do not drop application tables or reset the database. Do not apply blindly to a project that already has NUMPA tables or unrelated objects. The SQL has not been executed against PostgreSQL/Supabase in this environment, so syntax and resulting live policies remain unverified. Review the preview and run it first against development only.

## Local development configuration

The supplied development project is [numpa-v2-dev](https://supabase.com/dashboard/project/xjkulfyetcvuuhxhuevp) (`xjkulfyetcvuuhxhuevp`). Confirm its region in **Project Settings → General**. Open **Project Settings → API Keys** (or the project **Connect** dialog) and use a publishable `sb_publishable_…` key. The current web app needs no secret/service-role key.

From the repository root, create the ignored local file and edit it:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
notepad apps/web/.env.local
```

The file at `apps/web/.env.local` has the correct Project URL already. Set its publishable key locally, preserving the URL:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xjkulfyetcvuuhxhuevp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<PROJECT_KEY>
```

Do not send the key in chat or add actual values to Markdown, `.env.example`, or any tracked file. Tell the developer only that the values have been set. Do not add `sb_secret_…`, legacy `service_role`, database passwords, or tokens to any `NEXT_PUBLIC_` variable.

## Authentication URLs and email

In the development project, open **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Allowed redirect URL: `http://localhost:3000/auth/callback`

Password reset returns through the same callback with an internal `/auth/update-password` destination. Add the equivalent exact callback URL for staging/production only when those app domains exist. Avoid production wildcards. The local `supabase/config.toml` has localhost as its local Site URL; it does not configure a hosted project's dashboard settings.

For initial testing, Supabase's default email delivery can be used within its limits. Before real users, configure **Authentication → SMTP Settings** with a verified sending domain and provider; keep provider credentials in Supabase's settings. See [Supabase redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls) and [custom SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

## Deploy migrations to development

Install/use the Supabase CLI locally, authenticate in its own terminal prompt, and link the explicitly provided development project. Do not paste CLI tokens or database passwords into chat. CLI and Docker are not currently available in this workspace.

```powershell
$env:SUPABASE_HOME = 'D:\Codex\NUMPA\cache\supabase-home'
npx --yes --cache 'D:\Codex\NUMPA\cache\npm-cache' supabase@latest login
npx --yes --cache 'D:\Codex\NUMPA\cache\npm-cache' supabase@latest link --project-ref xjkulfyetcvuuhxhuevp
npx --yes --cache 'D:\Codex\NUMPA\cache\npm-cache' supabase@latest db push --dry-run --skip-vault
```

Check the displayed project target and pending migration list. It must be the development ref you recorded above and include exactly the pending NUMPA migration(s) you reviewed. Then apply to development:

```powershell
npx --yes --cache 'D:\Codex\NUMPA\cache\npm-cache' supabase@latest db push
npx --yes --cache 'D:\Codex\NUMPA\cache\npm-cache' supabase@latest migration list
```

Record the deployment date and result in this file. Verify Tables/Policies, Storage → `numpa-private` (private), and Auth configuration in that same project. The recommended `db push` path needs a linked project and may prompt for the database password locally. Supabase documents this in [CLI migration workflows](https://supabase.com/docs/guides/local-development/cli-workflows). SQL Editor is an alternative for a first-time application, but then track the migration history carefully; do not run both paths blindly.

No migration has been deployed by this task: there is no linked target, credentials, or CLI in the workspace. No production action was taken.

## Local app and verification

From `apps/web`:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000/demo` for local-only CSV processing. After configuring Supabase and applying migrations to development, verify:

1. Signup, confirmation email, callback to `/app`, login, password reset/update, and logout.
2. `/app` redirects signed-out users and lists the signed-in user's workspace only.
3. Analyze a synthetic CSV with **Save private copy** unchecked; it must stay in the browser.
4. Explicitly save a synthetic CSV; confirm it appears in workspace history and can be reopened.
5. Edit it and choose **Save as v2**; verify the new version and retained source version.
6. With a second test account, confirm it cannot list or download the first account's rows or objects.
7. Inspect RLS and Storage policies in the development project. The cross-account checks require a live project and have not been performed here.

## Remaining external setup

- Confirm and record the project's region from **Project Settings → General**.
- Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the existing ignored `apps/web/.env.local`; the Project URL is already configured there. Do not send the key in chat.
- Add the localhost Auth Site URL and callback in the project dashboard.
- Install/login/link Supabase CLI locally; verify the ref and dry-run plan. The two pending migrations make meaningful remote schema/policy changes; share the dry-run target and plan for explicit approval before applying them. Then record the migration list/result.
- Set up SMTP before inviting real users.
- After development verification, decide whether to create separate staging/production projects. Production deployment requires a separate review and explicit target-specific approval.

Backend/API worker, ML readiness processing, billing, team management, and hosting are outside the current Supabase integration scope. Keep credentials for future services in their provider/hosting secret managers only when those code paths are implemented.

