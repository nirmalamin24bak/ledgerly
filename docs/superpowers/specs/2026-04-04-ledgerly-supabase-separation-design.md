# Ledgerly — Supabase Separation Design

**Date:** 2026-04-04  
**Status:** Approved

## Problem

Ledgerly and Lancer share the same Supabase project (`sdjvbqkwgphtgdpnvraa`). This has required table naming workarounds (`bill_payments` instead of `payments`) and means schema changes in either app risk affecting the other. Ledgerly needs its own dedicated Supabase project.

## Goal

- Ledgerly gets its own Supabase project with no shared resources with Lancer
- Rename `bill_payments` → `payments` throughout (the name was a workaround, no longer needed)
- Migrate the one existing customer's data with zero data loss
- Update all env vars (web, Vercel, mobile)
- Push `ledgerly-mobile` to its own GitHub remote

## Approach

Manual SQL migration (Option B). No Supabase CLI required. Full control over the migration, auditable INSERT statements, handles the auth UUID remapping cleanly.

---

## Section 1 — Schema: rename `bill_payments` → `payments`

Rename every occurrence before running the schema on the new project.

**Files to update:**
- `supabase-schema.sql` — table definition, RLS policies, indexes, foreign keys
- `supabase-ai-query-rpc.sql` — NL→SQL RPC that references the table name
- All API routes in `app/api/` that query `bill_payments`
- `lib/ledger.ts` — creates ledger entries, may reference the table
- `CLAUDE.md` — remove the "bill_payments workaround" note, clean up the table naming note

**Search scope:** `grep -r "bill_payments" --include="*.ts" --include="*.sql" --include="*.md"`

---

## Section 2 — New Supabase Project Setup

**Manual step (user):** Create a new Supabase project in the dashboard. Name it `ledgerly`. Note the new project URL and keys.

**Automated steps:**
1. Run the updated `supabase-schema.sql` on the new project via the Supabase SQL editor
2. Run the updated `supabase-ai-query-rpc.sql` on the new project
3. Create a `bills` Storage bucket (public: false) in the new project

---

## Section 3 — Data Migration

### Auth user remapping

The existing customer's `owner_id` UUID in the old project will differ from the new project. The migration must handle this substitution.

**Steps:**
1. Query old project for the customer's UUID: `SELECT id, email FROM auth.users;`
2. In the new project: invite the customer by email (Supabase dashboard → Authentication → Invite user). They get a new UUID.
3. Query new project for their new UUID.
4. All INSERT statements use a placeholder that gets substituted: `OLD_OWNER_ID` → `NEW_OWNER_ID`

### Tables to migrate (in order, respecting FK constraints)

1. `ledger_projects` — no FK dependencies
2. `suppliers` — no FK dependencies  
3. `bills` — FK to `suppliers`
4. `payments` (was `bill_payments`) — FK to `suppliers`
5. `ledger_entries` — FK to `suppliers` only; `reference_id` is a loose UUID (no FK constraint), so no ordering dependency on bills/payments
6. `accountant_access` — stores accountant email + owner_id

### Export queries (run on old project)

Generate SELECT * from each table filtered by `owner_id = 'OLD_OWNER_ID'`, then wrap results as INSERT statements for the new project.

We write a migration SQL file that:
- Uses a `DO $$ ... $$` block with the old UUID as a constant
- Outputs clean INSERT statements ready to run on the new project after UUID substitution

### accountant_access

If the customer has accountant team members, their emails are stored in `accountant_access`. These users will need to be invited on the new project too (same process: invite by email, get new UUID, update `accountant_id` in the imported row).

---

## Section 4 — Storage Migration

Bills are stored at `{owner_id}/{timestamp}-{uuid}.{ext}` in the `bills` bucket.

**Migration script** (Node.js, run locally):
1. Use old Supabase service role key to list all files under `OLD_OWNER_ID/` in `bills` bucket
2. Download each file (signed URL)
3. Re-upload to new project's `bills` bucket under `NEW_OWNER_ID/{filename}`
4. After all uploads complete, UPDATE the `bills` table to fix `file_path` values (replace `OLD_OWNER_ID` prefix with `NEW_OWNER_ID`)

The script is a one-off and gets deleted after migration.

---

## Section 5 — Environment Variable Updates

Three locations:

### Web (`C:\Users\nirma\ledgerly\.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=      # new project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # new anon key
SUPABASE_SERVICE_ROLE_KEY=     # new service role key
ANTHROPIC_API_KEY=             # unchanged
NEXT_PUBLIC_APP_URL=           # unchanged
```

### Vercel (production)
Same three Supabase vars updated via Vercel dashboard (or `vercel env` CLI if installed).

### Mobile (`C:\Users\nirma\ledgerly-mobile\.env`)
```
EXPO_PUBLIC_SUPABASE_URL=      # new project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY= # new anon key
EXPO_PUBLIC_API_URL=           # unchanged
```

---

## Section 6 — Mobile Git Remote

`ledgerly-mobile` has a local git repo but no remote. Push it to GitHub.

**Steps:**
1. Create repo `ledgerly-mobile` on GitHub (`github.com/nirmalamin24bak/ledgerly-mobile`)
2. `git remote add origin https://github.com/nirmalamin24bak/ledgerly-mobile.git`
3. `git push -u origin master`

---

## Out of Scope

- Lancer's Supabase setup (separate project, not touched)
- Buildmate (completely separate infrastructure, not touched)
- Mobile app store submission (separate task)
- Changing the mobile app's `EXPO_PUBLIC_API_URL` — it still points to `yourledgerly.com` which is correct

## Success Criteria

- [ ] Ledgerly web connects exclusively to new Supabase project
- [ ] Ledgerly mobile connects exclusively to new Supabase project
- [ ] Old shared Supabase project still works for Lancer (untouched)
- [ ] All customer data present in new project: suppliers, bills, payments, ledger entries
- [ ] Bill file attachments accessible via new project storage
- [ ] Customer can log in with their email on the new project
- [ ] `bill_payments` renamed to `payments` everywhere in code and SQL
- [ ] `ledgerly-mobile` pushed to GitHub remote
- [ ] CLAUDE.md updated to reflect clean single-project ownership
