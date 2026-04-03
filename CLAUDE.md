# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What This Is

**Ledgerly** — AI-powered bill scanning and expense tracking for businesses and individuals. Built with Next.js 14 App Router, Supabase (PostgreSQL + Auth + Storage), and Anthropic Claude for vision and NL-to-SQL.

## Commands

```bash
npm run dev       # Dev server on :3000
npm run build     # Production build
npm run lint      # ESLint
```

No test suite — this project has no tests.

## Architecture

### Multi-tenancy
Every table has `owner_id` referencing `auth.users`. All API routes extract `owner_id` from the Supabase session — never from client input. Accountants can view owners' data via `accountant_access` table. The `accessible_owner_ids()` DB function enforces this in RLS policies.

### Data Flow
- Pages are Server Components → fetch data server-side → pass as props
- `'use client'` components handle forms and dialogs
- After successful actions, dialogs call `window.location.reload()` — intentional, not a bug
- All DB writes go through API routes in `app/api/`

### AI Layer (`lib/ai.ts`)
- `extractBillData()` — sends image to Claude claude-opus-4-6 via vision, returns structured `ExtractedBillData`
- `nlToSql()` — sends plain English query to Claude claude-sonnet-4-6, returns safe SELECT SQL
- Both functions use lazy client instantiation (`getClient()`) to avoid build-time errors

### Ledger Logic (`lib/ledger.ts`)
- `createLedgerEntry()` — called after every bill (debit) and payment (credit)
- Maintains `running_balance` per supplier by summing previous balance ± new entry
- Uses `createServiceClient()` (service role) to bypass RLS for internal ledger writes

### Table Naming Note
The payments table is named **`bill_payments`** (not `payments`) because the Supabase project also hosts the Lancer app which has its own `payments` table. Do not rename it.

### Supabase Clients
- `lib/supabase/client.ts` — browser client (`createBrowserClient`), used in `'use client'` components
- `lib/supabase/server.ts` — server client (`createServerClient`) for Server Components and API routes; `createServiceClient()` bypasses RLS for internal operations

### Route Protection
`middleware.ts` redirects unauthenticated users to `/login`. Public paths: `/login`, `/auth/*`. All dashboard routes are protected.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role (server-only, never expose)
ANTHROPIC_API_KEY=              # Claude API key (server-only)
NEXT_PUBLIC_APP_URL=            # Canonical app URL
```

## Key Files

| File | Purpose |
|---|---|
| `lib/ai.ts` | Claude vision extraction + NL→SQL |
| `lib/ledger.ts` | Running balance logic |
| `lib/supabase/server.ts` | Server + service-role Supabase clients |
| `types/index.ts` | All TypeScript interfaces |
| `supabase-schema.sql` | Full DB schema — run this first |
| `supabase-ai-query-rpc.sql` | AI query RPC — run after schema |

### Rate Limiting (`lib/rate-limit.ts`)

In-memory rate limiter with named presets. Apply via the preset helpers at the top of each API route handler:

| Preset | Limit |
|---|---|
| `AI` | 20 req/min |
| `UPLOAD` | 10 req/min |
| `WRITE` | 60 req/min |
| `READ` | 120 req/min |

### File Storage

Bills are uploaded to the `bills` Supabase Storage bucket. Storage paths are `{owner_id}/{timestamp}-{uuid}.{ext}` — never the original filename. Extension is validated against `ALLOWED_EXTENSIONS`; MIME type alone is not trusted. `createServiceClient()` is used for uploads to bypass RLS. The `file_path` column is updated in a separate `UPDATE` after the bill row is inserted to avoid PostgREST schema cache issues on fresh columns.

### Project Scoping (Optional Feature)

Bills, payments, and suppliers can optionally be scoped to a `ledger_projects` row via a `ledgerly_project_id` cookie. Before inserting `project_id`, all three POST routes verify the project belongs to the authenticated user:

```ts
if (projectId) {
  const { data: project } = await supabase
    .from('ledger_projects').select('id')
    .eq('id', projectId).eq('owner_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 403 })
}
```

Always use `...(projectId ? { project_id: projectId } : {})` — never unconditionally include `project_id` in an insert, as the column may not exist in the schema yet.

### AI Date Normalization

Claude sometimes returns dates in DD-MM-YYYY format despite the system prompt requesting YYYY-MM-DD (Indian locale influence). `bill-upload-form.tsx` normalizes these with `normalizeDate()` before submission. If adding new date fields that flow through Claude extraction, pipe them through `normalizeDate()` as well.

## Important Rules

- Never pass functions as props from Server → Client components (Next.js serialization error)
- The `bill_payments` table name is intentional — do not change to `payments`
- All amounts stored as `DECIMAL(15,2)` — always `Number(value)` when reading from DB
- PDF bill scanning is not supported — Claude vision requires image format (JPG/PNG/WEBP)
- `createServiceClient()` bypasses RLS — only use for server-side internal operations
- Never unconditionally include optional columns (like `project_id`) in DB inserts — use conditional spread in case the column doesn't exist in the schema cache
