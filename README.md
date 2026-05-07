# Vevia (App)

This is the Next.js app for the Vevia platform described in the repository-level `README.MD` and `DESIGN.html`.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### Required env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for `/api/apply/*`, resume uploads, cron, and scoring)
- `GROQ_API_KEY` + `GROQ_MODEL_LARGE` + `GROQ_MODEL_FAST` (required for resume parsing + screening + scoring)

Optional:

- `RESEND_API_KEY` + `RESEND_WEBHOOK_SECRET` (email)
- `WHATSAPP_*` (WhatsApp webhook + messaging)
- `CRON_SECRET` (protect `/api/cron/*`)

## Supabase

- Migrations: `supabase/migrations/*`
- Includes RLS policies + constraints (`003_*`) and an Auth trigger to create a `public.users` row on signup (`004_*`).
- After signing in, visit `/onboarding` once to create an organization and bind your user to it.

## Build / test

```bash
pnpm lint
pnpm test
pnpm build
```
