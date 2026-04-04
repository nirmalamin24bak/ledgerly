# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Ledgerly** — AI-powered bill scanning and GST expense tracking for Indian businesses. Next.js 14 App Router, Supabase (PostgreSQL + Auth + Storage), Anthropic Claude for vision extraction and NL-to-SQL, plan-gated scan limits (free/pro/enterprise).

## Commands

```bash
npm run dev       # Dev server on :3000
npm run build     # Production build
npm run lint      # ESLint
```

No test suite.

## Architecture

### Multi-tenancy
Every table has `owner_id` referencing `auth.users`. All API routes extract `owner_id` from the Supabase session — never from client input. Accountants can view owners' data via the `accountant_access` table. The `accessible_owner_ids()` DB function enforces this in RLS policies.

### Data Flow
- Pages are Server Components → fetch data server-side → pass as props to `'use client'` components
- After successful actions, dialogs call `window.location.reload()` — intentional, not a bug
- All DB writes go through API routes in `app/api/`

### Supabase Clients (`lib/supabase/`)
- `client.ts` — browser client (`createBrowserClient`), for `'use client'` components
- `server.ts` — `createClient()` for Server Components and API routes; `createServiceClient()` (service role) bypasses RLS for internal operations like ledger writes, file uploads, and AI operations

### Route Protection
`middleware.ts` redirects unauthenticated users to `/login`. Public paths: `/`, `/login`, `/auth/*`, `/terms`, `/privacy`, `/refund`. Authenticated users at `/login` are redirected to `/dashboard`.

### AI Layer (`lib/ai.ts`)
Three exported functions — all use lazy `getClient()` to avoid build-time errors:

- **`scanWithVision(base64, mimeType, model)`** — sends image to Claude vision, returns `InternalScanResult` with `data`, `nullCount` (count of null critical fields), and `modelUsed`
- **`scanWithText(text)`** — sends extracted PDF text to Haiku, same return type  
- **`nlToSql(query, ownerIds)`** — converts plain English to a safe SELECT query via Sonnet; validates UUIDs before embedding in prompt; blocks all mutation keywords; verifies `owner_id` filter is present in generated SQL

Model IDs:
| Alias | Model ID | Used for |
|---|---|---|
| `haiku` | `claude-haiku-4-5-20251001` | Primary scan (vision + text), NL→SQL |
| `opus` | `claude-opus-4-6` | Enterprise fallback when Haiku returns ≥3 null critical fields |
| — | `claude-sonnet-4-6` | `nlToSql()` |

### Scan Routing (`lib/scan/router.ts`)
`routeScan(file, mimeType, userId, plan)` is the single entry point for all bill scanning:

1. Checks monthly scan limit via `scan_usage` table — throws `ScanLimitError` (→ HTTP 402) if exceeded
2. Routes by plan + file type:
   - **Free plan**: Always Haiku vision
   - **PDF + Pro/Enterprise**: `pdf-parse` extracts text → if >100 chars use `scanWithText`, else fall back to Haiku vision
   - **Enterprise only**: if Haiku returns `nullCount ≥ 3`, retries with Opus and keeps the better result
3. Increments `scan_usage` counter atomically via Supabase RPC (non-fatal if it fails)

Plan limits (in `lib/scan/usage.ts`): free = 20, pro = 200, enterprise = ∞.
Plan stored in `auth.users.user_metadata.plan`. Default: `'free'`.

### Ledger Logic (`lib/ledger.ts`)
- `createLedgerEntry()` — called after every bill (debit) and payment (credit); uses service-role client; fetches last running balance then inserts new entry atomically
- Running balance: previous ± amount (+ for debit, − for credit)

### File Storage
Bills stored in the `bills` Supabase Storage bucket (private). Path: `{owner_id}/{timestamp}-{uuid}.{ext}` — never the original filename. Extension validated against `ALLOWED_EXTENSIONS`; MIME type alone not trusted. `file_path` column updated in a separate `UPDATE` after bill row insert to avoid PostgREST schema cache issues on fresh columns.

### Rate Limiting (`lib/rate-limit.ts`)
In-memory per-user limiter. Presets: `AI` 20/min, `UPLOAD` 10/min, `WRITE` 60/min, `READ` 120/min. Apply at the top of each API route. For production scale, replace with Redis.

### Project Scoping (Optional)
Bills, payments, suppliers can be scoped to `ledger_projects` via a `ledgerly_project_id` cookie. Always verify the project belongs to `user.id` before using the ID. Always use conditional spread: `...(projectId ? { project_id: projectId } : {})` — never unconditionally include `project_id`.

### AI Date Normalization
Claude sometimes returns dates as DD-MM-YYYY despite the system prompt requesting YYYY-MM-DD. `bill-upload-form.tsx` normalizes via `normalizeDate()` before submission. Pipe any new Claude date fields through `normalizeDate()`.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public anon key
SUPABASE_SERVICE_ROLE_KEY=      # Server-only — never expose to client
ANTHROPIC_API_KEY=              # Server-only
NEXT_PUBLIC_APP_URL=            # Canonical URL (e.g. https://ledgerly.app)
```

## Key Files

| File | Purpose |
|---|---|
| `lib/ai.ts` | Claude vision extraction, text mode, NL→SQL |
| `lib/ledger.ts` | Running balance logic |
| `lib/scan/router.ts` | Plan-gated scan routing (Haiku → Opus fallback, PDF text mode) |
| `lib/scan/usage.ts` | Monthly scan counter + plan limits |
| `lib/supabase/server.ts` | Server + service-role Supabase clients |
| `types/index.ts` | All TypeScript interfaces |
| `supabase-schema.sql` | Full DB schema + RLS policies + scan_usage table |

## Important Rules

- Never pass functions as props from Server → Client components (Next.js serialization error)
- All amounts stored as `DECIMAL(15,2)` — always `Number(value)` when reading from DB
- `createServiceClient()` bypasses RLS — only use for server-side internal operations
- PDF scanning routes through `pdf-parse` (CommonJS — use `require()`, not `import`) before vision; only for Pro+ plans
- `user_metadata` stores `plan` ('free'|'pro'|'enterprise') and `account_type` ('individual'|'company') — read from session, update via `service.auth.admin.updateUserById()`
- `user_profiles` stores `name`, `phone`, `company_name`, `gstin`, `pan_number`, `address`, `role` ('owner'|'accountant') — update via regular PostgREST client with RLS
