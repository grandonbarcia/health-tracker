# Thryve

Thryve is a full-stack health tracker built with Next.js and Supabase. It includes nutrition logging, workouts, vital signs tracking, and social/community features (profiles, connections, and messaging).

## Features

- **Authentication**: Email/password auth via Supabase
- **Nutrition tracking**: Log meals by day/meal, search foods, view weekly trends
- **Workouts**: Log workouts + exercises, exercise template library
- **Vital signs**: Record and chart vitals over time
- **Community**: User profiles, connections, messaging, favorites

## Tech stack

- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)

## Local development

### Prerequisites

- Node.js 22+ recommended (Netlify build uses Node 22)
- A Supabase project

### Install

```bash
npm install
```

### Environment variables

Create a `.env.local` in the project root:

```bash
# Required (client + server)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (server-only). Required for a few API routes that do admin lookups.
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional aliases (some server utilities look for these names)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notes:

- The browser client is created in `src/lib/supabaseClient.ts` and will throw on startup if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Keep it server-side only.

### Supabase auth redirect

Signup uses `emailRedirectTo: <origin>/auth/callback`, so your Supabase project should allow this redirect URL:

- `http://localhost:3000/auth/callback` (local dev)

Also add your deployed site callback URL when deploying.

### GitHub OAuth (Supabase)

This app supports GitHub sign-in via Supabase OAuth.

1. In Supabase: **Authentication → Providers → GitHub**

   - Enable GitHub
   - Paste your GitHub OAuth app **Client ID** and **Client Secret**

2. In GitHub: create an OAuth App

   - Homepage URL: `http://localhost:3000` (for local dev)
   - Authorization callback URL: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`

3. In Supabase: **Authentication → URL Configuration**
   - Add these redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://<your-production-domain>/auth/callback`

### Database setup (Supabase)

This repo expects several Postgres tables. The fastest path is:

1. Create a Supabase project
2. Open **SQL Editor** in Supabase
3. Run the SQL from the files below

Minimum required to use nutrition logging (per-user days/items):

- `FIX_SAVE_ERROR.md` (copy/paste the SQL block for `user_days` + `user_day_items`)

Recommended/optional tables depending on features you use:

- `MANUAL_SQL_user_settings.sql` (nutrition goals)
- `scripts/create-exercise-tables.sql` (workouts + exercise templates)
- `scripts/populate-exercise-templates.sql` (seed the template library)

RLS / security helpers (run after tables exist):

- `scripts/enable-rls.sql`
- `scripts/fix-security-issues.sql`

Important:

- Some parts of the app still reference a legacy `days` table via API routes (see `/api/load-day` and `/api/save-day`). If you rely on those endpoints, ensure your database includes the `days` table and RLS policies (see `scripts/fix-security-issues.sql`).
- Vital sign data is referenced as `user_vitals` in some UI pages and `user_vital_signs` in some API routes. If vitals aren’t working, check which table name exists in your database and align it.

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm test
```

## Deployment

### Netlify

This project includes `netlify.toml` and uses `@netlify/plugin-nextjs`.

- Build command: `npm run build`
- Publish directory: `.next`

Set the same environment variables in Netlify as in `.env.local`.

## Useful docs in this repo

- `SETUP_DATABASE.md` / `FIX_SAVE_ERROR.md`: troubleshooting missing tables
- `MULTI_USER_GUIDE.md`: multi-user behavior and testing
- `PER_USER_DATA_ISOLATION.md`: how authenticated vs unauthenticated storage is handled
- `docs/EXERCISE_DATABASE_SETUP.md`: workout schema setup
