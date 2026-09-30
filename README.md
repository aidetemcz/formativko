# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

The app is hosted on **Vercel**, which builds and deploys automatically on every
push to `master`. There is no deploy workflow in this repository — Vercel's
GitHub integration handles it.

`vercel.json` holds the two settings that matter:

- a rewrite sending every non-file path to `index.html`, because React Router
  owns the URL and without it a direct visit to `/lessons` would 404. `/api` is
  excluded from it explicitly, so a function call can never be answered with the
  HTML page;
- a long `Cache-Control` for `/assets/*`, which is safe because Vite
  fingerprints those filenames.

The app is served from the domain root, so `base` is left at Vite's default.

Vercel validates that file against a schema that forbids unknown keys, so it
cannot carry explanatory comments — hence this section. `npm test` checks it
against Vercel's own exported schema, because an invalid file builds cleanly
here and only fails once deployed.

Configuration comes from the committed `.env` (the Supabase publishable key is
public by design). To point a deployment at a different Supabase project,
override `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and
`VITE_SUPABASE_PROJECT_ID` in Vercel's environment variables.

## AI endpoints

The seven AI features are Vercel Functions under `api/`, one file per endpoint.
They were previously Supabase Edge Functions; each was ported with its prompts
and response handling unchanged, and `api/_lib/handler.ts` adapts Vercel's Node
signature to the Web-standard `Request`/`Response` those handlers were written
against.

Every handler verifies the caller's Supabase session before spending an OpenAI
call, so the endpoints are not open to the internet. `maxDuration` is raised to
60s because model calls routinely exceed the 10s default.

The client never calls them directly — `src/lib/ai.ts` attaches the access
token and mirrors the `{ data, error }` result shape.

Relative imports inside `api/` must carry an explicit `.js` extension, which
TypeScript maps back to the `.ts` source. Vercel compiles these files with
`moduleResolution: nodenext`, which requires it; an extensionless import still
*builds*, then fails at runtime when the module cannot be resolved, so the
endpoint returns a 500 with no JSON body. `tsconfig.api.json` sets the same
resolution mode so `npm run typecheck` catches it first.

### Regenerating the Supabase types

`src/integrations/supabase/types.ts` is generated, never hand-edited. When a
migration adds or changes a table, regenerate it or `tsc` will report errors for
columns the code legitimately uses:

```sh
npx supabase gen types typescript --project-id btqkjdyvwiojfcsjlifh > src/integrations/supabase/types.ts
```

Without access to the project, the same file can be produced from the migrations
alone: apply `supabase/migrations/*.sql` in order to an empty PostgreSQL 16
database — first creating the `auth` and `storage` objects they reference, and
`auth.uid()` / `auth.role()` / `storage.foldername()` — then point the generator
at that database with `--db-url`. Do not install `pgcrypto` into `public`; its
functions would end up in the generated output, and Postgres 16 already provides
`gen_random_uuid()`.

### Required environment variables

Set these in Vercel under Project > Settings > Environment Variables. They are
read at runtime by the functions, so unlike the `VITE_*` values they cannot come
from the committed `.env`:

| Variable | Used by |
| --- | --- |
| `OPENAI_API_KEY` | all seven endpoints |
| `SUPABASE_URL` | verifying the caller's session |
| `SUPABASE_ANON_KEY` | verifying the caller's session |
| `SUPABASE_SERVICE_ROLE_KEY` | `generate-evaluation` only |

Supabase injected the three `SUPABASE_*` values automatically; Vercel does not,
so they have to be filled in by hand. Keep the service role key to the server —
it bypasses row-level security.

## Custom domain

Add the domain in Vercel under Project > Settings > Domains and create the DNS
record it asks for. Then update Site URL and Redirect URLs in Supabase under
Authentication > URL Configuration to match, or sign-in and the confirmation
links in registration e-mails will break.
