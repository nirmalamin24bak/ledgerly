# Ledgerly Supabase Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Ledgerly its own dedicated Supabase project, migrate the one customer's data, rename `bill_payments` → `payments`, push mobile to GitHub, and update all env vars.

**Architecture:** Code changes first (rename + scripts), then manual Supabase project creation, then data/storage migration, then env var updates. No test suite — verification is manual (run dev server, check UI).

**Tech Stack:** Next.js 14, Supabase JS v2, TypeScript, `npx tsx` for running migration scripts.

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `supabase-schema.sql` | Modify | Rename `bill_payments` → `payments` everywhere |
| `supabase-ai-query-rpc.sql` | Check + modify if needed | Rename any `bill_payments` reference |
| `lib/ai.ts` | Modify line 142 | Rename `bill_payments` in NL→SQL system prompt |
| `app/(dashboard)/payments/page.tsx` | Modify line 20 | Rename `.from('bill_payments')` |
| `app/(dashboard)/suppliers/[id]/page.tsx` | Modify line 16 | Rename `.from('bill_payments')` |
| `app/api/payments/route.ts` | Modify lines 66, 95, 132 | Rename `.from('bill_payments')` |
| `app/api/suppliers/[id]/route.ts` | Modify line 82 | Rename `.from('bill_payments')` |
| `README.md` | Modify line 132 | Rename `bill_payments` mention |
| `CLAUDE.md` | Modify lines 41, 108 | Remove workaround note, update table name |
| `scripts/export-data.sql` | Create | SQL that generates INSERT statements from old project |
| `scripts/migrate-storage.ts` | Create | Downloads files from old bucket, re-uploads to new |
| `.env.local` | Modify | Point to new Supabase project |
| `ledgerly-mobile/.env` | Modify | Point to new Supabase project |

---

## Task 1: Rename `bill_payments` → `payments` in `supabase-schema.sql`

**Files:**
- Modify: `supabase-schema.sql`

Note: line 129 in the current schema already incorrectly says `ALTER TABLE payments ENABLE ROW LEVEL SECURITY;` while the table is still named `bill_payments`. This task makes the schema consistent.

- [ ] **Step 1: Open `supabase-schema.sql` and apply all renames**

Make these exact changes:

Line 74: change
```sql
CREATE TABLE bill_payments (
```
to:
```sql
CREATE TABLE payments (
```

Lines 113–115: change
```sql
CREATE INDEX idx_bill_payments_owner         ON bill_payments(owner_id);
CREATE INDEX idx_bill_payments_supplier      ON bill_payments(supplier_id);
CREATE INDEX idx_bill_payments_bill          ON bill_payments(bill_id);
```
to:
```sql
CREATE INDEX idx_payments_owner    ON payments(owner_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_bill     ON payments(bill_id);
```

Line 129: already correct (`ALTER TABLE payments ENABLE ROW LEVEL SECURITY;`) — leave as-is.

Lines 173–180: change
```sql
CREATE POLICY "read accessible bill_payments"
  ON bill_payments FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "insert bill_payment"
  ON bill_payments FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update bill_payment"
  ON bill_payments FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "delete bill_payment"
  ON bill_payments FOR DELETE USING (owner_id = auth.uid());
```
to:
```sql
CREATE POLICY "read accessible payments"
  ON payments FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "insert payment"
  ON payments FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update payment"
  ON payments FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "delete payment"
  ON payments FOR DELETE USING (owner_id = auth.uid());
```

- [ ] **Step 2: Verify no remaining `bill_payments` in schema**

Run:
```bash
grep "bill_payments" /c/Users/nirma/ledgerly/supabase-schema.sql
```
Expected: no output.

---

## Task 2: Rename `bill_payments` in TypeScript files

**Files:**
- Modify: `app/(dashboard)/payments/page.tsx` line 20
- Modify: `app/(dashboard)/suppliers/[id]/page.tsx` line 16
- Modify: `app/api/payments/route.ts` lines 66, 95, 132
- Modify: `app/api/suppliers/[id]/route.ts` line 82

- [ ] **Step 1: Update `app/(dashboard)/payments/page.tsx` line 20**

Change:
```ts
    .from('bill_payments')
```
to:
```ts
    .from('payments')
```

- [ ] **Step 2: Update `app/(dashboard)/suppliers/[id]/page.tsx` line 16**

Change:
```ts
    supabase.from('bill_payments').select('*').eq('supplier_id', params.id).order('payment_date', { ascending: false }),
```
to:
```ts
    supabase.from('payments').select('*').eq('supplier_id', params.id).order('payment_date', { ascending: false }),
```

- [ ] **Step 3: Update `app/api/payments/route.ts` — three occurrences**

Line 66, change:
```ts
      .from('bill_payments')
```
to:
```ts
      .from('payments')
```

Line 95, change:
```ts
          .from('bill_payments')
```
to:
```ts
          .from('payments')
```

Line 132, change:
```ts
      .from('bill_payments')
```
to:
```ts
      .from('payments')
```

- [ ] **Step 4: Update `app/api/suppliers/[id]/route.ts` line 82**

Change:
```ts
      supabase.from('bill_payments').select('*', { count: 'exact', head: true })
```
to:
```ts
      supabase.from('payments').select('*', { count: 'exact', head: true })
```

- [ ] **Step 5: Verify no remaining `bill_payments` in TypeScript files**

Run:
```bash
grep -rn "bill_payments" /c/Users/nirma/ledgerly --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next" | grep -v "docs/"
```
Expected: no output.

---

## Task 3: Rename `bill_payments` in `lib/ai.ts` and `README.md`

**Files:**
- Modify: `lib/ai.ts` line 142
- Modify: `README.md` line 132

- [ ] **Step 1: Update `lib/ai.ts` line 142**

Change:
```ts
- bill_payments(id, owner_id, supplier_id, bill_id, amount, payment_date, mode)
```
to:
```ts
- payments(id, owner_id, supplier_id, bill_id, amount, payment_date, mode)
```

- [ ] **Step 2: Update `README.md` line 132**

Change:
```
bill_payments     → amount, mode, reference, links to bill
```
to:
```
payments          → amount, mode, reference, links to bill
```

---

## Task 4: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Remove the workaround note at line 41**

Change:
```markdown
### Table Naming Note
The payments table is named **`bill_payments`** (not `payments`) because the Supabase project also hosts the Lancer app which has its own `payments` table. Do not rename it.
```
to:
```markdown
### Table Naming Note
The payments table is named **`payments`**. Ledgerly has its own dedicated Supabase project (separate from Lancer).
```

- [ ] **Step 2: Remove the rule at line 108**

Change:
```markdown
- The `bill_payments` table name is intentional — do not change to `payments`
```
to:
```markdown
- The payments table is named `payments` — Ledgerly has its own Supabase project, no naming conflicts with other apps
```

---

## Task 5: Commit code changes

- [ ] **Step 1: Stage and commit all renamed files**

```bash
cd /c/Users/nirma/ledgerly
git add supabase-schema.sql lib/ai.ts README.md CLAUDE.md \
  "app/(dashboard)/payments/page.tsx" \
  "app/(dashboard)/suppliers/[id]/page.tsx" \
  app/api/payments/route.ts \
  "app/api/suppliers/[id]/route.ts"
git commit -m "refactor: rename bill_payments → payments (dedicated Supabase project)

The bill_payments name was a workaround for sharing a Supabase project
with Lancer. Now that Ledgerly has its own project, the table is renamed
to payments throughout.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Create data export SQL script

**Files:**
- Create: `scripts/export-data.sql`

This script is run in the **old** project's Supabase SQL Editor. It generates INSERT statements to copy into the new project. Replace `OLD_OWNER_ID` with the customer's actual UUID before running.

- [ ] **Step 1: Create `scripts/export-data.sql`**

```sql
-- ============================================================
-- LEDGERLY DATA EXPORT
-- Run in OLD project's SQL Editor (Dashboard → SQL Editor)
-- Replace OLD_OWNER_ID with the customer's auth UUID:
--   SELECT id, email FROM auth.users;
-- ============================================================

-- ---- STEP 1: Find old owner UUID ----
SELECT id, email FROM auth.users;

-- ---- After getting UUID, replace OLD_OWNER_ID below ----

-- ---- STEP 2: Export suppliers ----
SELECT
  'INSERT INTO suppliers (id, owner_id, name, gst_number, category, phone, email, address, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || ', ''NEW_OWNER_ID_HERE'', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(gst_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(category), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' AS insert_stmt
FROM suppliers
WHERE owner_id = 'OLD_OWNER_ID';

-- ---- STEP 3: Export bills ----
SELECT
  'INSERT INTO bills (id, supplier_id, owner_id, invoice_number, invoice_date, due_date, total_amount, gst_amount, cgst_amount, sgst_amount, igst_amount, taxable_amount, tds_applicable, tds_rate, tds_amount, status, file_url, file_name, notes, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(supplier_id::text) || ', ''NEW_OWNER_ID_HERE'', ' ||
  COALESCE(quote_literal(invoice_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(invoice_date::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(due_date::text), 'NULL') || ', ' ||
  total_amount::text || ', ' ||
  gst_amount::text || ', ' ||
  cgst_amount::text || ', ' ||
  sgst_amount::text || ', ' ||
  igst_amount::text || ', ' ||
  taxable_amount::text || ', ' ||
  tds_applicable::text || ', ' ||
  COALESCE(tds_rate::text, 'NULL') || ', ' ||
  tds_amount::text || ', ' ||
  quote_literal(status) || ', ' ||
  COALESCE(quote_literal(file_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(file_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' AS insert_stmt
FROM bills
WHERE owner_id = 'OLD_OWNER_ID';

-- ---- STEP 4: Export payments ----
SELECT
  'INSERT INTO payments (id, supplier_id, bill_id, owner_id, amount, payment_date, mode, reference_number, notes, created_at) VALUES (' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(supplier_id::text) || ', ' ||
  COALESCE(quote_literal(bill_id::text), 'NULL') || ', ''NEW_OWNER_ID_HERE'', ' ||
  amount::text || ', ' ||
  quote_literal(payment_date::text) || ', ' ||
  quote_literal(mode) || ', ' ||
  COALESCE(quote_literal(reference_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ');' AS insert_stmt
FROM bill_payments
WHERE owner_id = 'OLD_OWNER_ID';

-- ---- STEP 5: Export ledger_entries ----
SELECT
  'INSERT INTO ledger_entries (id, supplier_id, owner_id, type, reference_type, reference_id, amount, running_balance, entry_date, description, created_at) VALUES (' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(supplier_id::text) || ', ''NEW_OWNER_ID_HERE'', ' ||
  quote_literal(type) || ', ' ||
  quote_literal(reference_type) || ', ' ||
  quote_literal(reference_id::text) || ', ' ||
  amount::text || ', ' ||
  running_balance::text || ', ' ||
  quote_literal(entry_date::text) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ');' AS insert_stmt
FROM ledger_entries
WHERE owner_id = 'OLD_OWNER_ID';

-- ---- STEP 6: Export user_profiles ----
SELECT
  'INSERT INTO user_profiles (id, name, role, created_at, updated_at) VALUES (''NEW_OWNER_ID_HERE'', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(role) || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' AS insert_stmt
FROM user_profiles
WHERE id = 'OLD_OWNER_ID';
```

---

## Task 7: Create storage migration script

**Files:**
- Create: `scripts/migrate-storage.ts`

This script downloads all bill files from the old Supabase Storage bucket and re-uploads them to the new project under the new owner UUID.

- [ ] **Step 1: Create `scripts/migrate-storage.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

// ── FILL THESE IN BEFORE RUNNING ──────────────────────────────
const OLD_URL = 'https://sdjvbqkwgphtgdpnvraa.supabase.co'
const OLD_SERVICE_KEY = '' // old SUPABASE_SERVICE_ROLE_KEY from .env.local
const NEW_URL = ''         // new project URL
const NEW_SERVICE_KEY = '' // new SUPABASE_SERVICE_ROLE_KEY

const OLD_OWNER_ID = ''    // customer UUID in OLD project
const NEW_OWNER_ID = ''    // customer UUID in NEW project (after invite)
// ──────────────────────────────────────────────────────────────

const oldClient = createClient(OLD_URL, OLD_SERVICE_KEY)
const newClient = createClient(NEW_URL, NEW_SERVICE_KEY)

async function migrateStorage() {
  console.log('Listing files in old bucket...')
  const { data: files, error: listError } = await oldClient.storage
    .from('bills')
    .list(OLD_OWNER_ID, { limit: 1000 })

  if (listError) throw new Error(`List failed: ${listError.message}`)
  if (!files || files.length === 0) {
    console.log('No files found in old bucket. Done.')
    return
  }

  console.log(`Found ${files.length} file(s). Migrating...`)

  for (const file of files) {
    const oldPath = `${OLD_OWNER_ID}/${file.name}`
    const newPath = `${NEW_OWNER_ID}/${file.name}`

    // Download from old project
    const { data: blob, error: downloadError } = await oldClient.storage
      .from('bills')
      .download(oldPath)

    if (downloadError || !blob) {
      console.error(`  SKIP ${oldPath}: download failed — ${downloadError?.message}`)
      continue
    }

    // Upload to new project
    const { error: uploadError } = await newClient.storage
      .from('bills')
      .upload(newPath, blob, { upsert: true })

    if (uploadError) {
      console.error(`  FAIL ${newPath}: upload failed — ${uploadError.message}`)
      continue
    }

    console.log(`  OK   ${oldPath} → ${newPath}`)
  }

  console.log('\nStorage migration complete.')
  console.log(`\nNow run this SQL in the NEW project to fix file_url paths:`)
  console.log(`UPDATE bills SET file_url = REPLACE(file_url, '${OLD_OWNER_ID}', '${NEW_OWNER_ID}') WHERE owner_id = '${NEW_OWNER_ID}' AND file_url IS NOT NULL;`)
}

migrateStorage().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

---

## Task 8: MANUAL — Create new Supabase project and invite customer

> **This task is done by you in the Supabase dashboard. No code changes.**

- [ ] **Step 1: Create new project**
  - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
  - Click "New project"
  - Name: `ledgerly`
  - Region: `ap-south-1` (Mumbai — same as current)
  - Save the database password somewhere safe
  - Wait for project to finish provisioning (~2 min)

- [ ] **Step 2: Note new project credentials**
  From the new project → Settings → API:
  - `Project URL` → this is `NEW_URL`
  - `anon public` key → this is `NEW_ANON_KEY`
  - `service_role` key → this is `NEW_SERVICE_KEY`

- [ ] **Step 3: Get old owner UUID**
  In the OLD project's SQL Editor, run:
  ```sql
  SELECT id, email FROM auth.users;
  ```
  Copy the UUID. This is `OLD_OWNER_ID`.

- [ ] **Step 4: Invite customer in new project**
  In the NEW project → Authentication → Users → "Invite user"
  Enter the customer's email address.
  They will receive an email to set a password for the new project.

- [ ] **Step 5: Note new owner UUID**
  After inviting, the user appears in Authentication → Users.
  Copy their UUID. This is `NEW_OWNER_ID`.

- [ ] **Step 6: Create storage bucket in new project**
  In the NEW project → Storage → "New bucket"
  - Name: `bills`
  - Public: OFF (unchecked)
  - Click Create

  Then add policies. Go to Storage → Policies → `bills` bucket → New policy:

  Policy 1 — Upload:
  ```sql
  (bucket_id = 'bills' AND auth.uid() IS NOT NULL)
  ```
  Operation: INSERT

  Policy 2 — Read:
  ```sql
  (bucket_id = 'bills' AND auth.uid() IS NOT NULL)
  ```
  Operation: SELECT

---

## Task 9: MANUAL — Run schema on new project

> **Done in the new project's Supabase SQL Editor.**

- [ ] **Step 1: Run schema**
  Open `supabase-schema.sql` (the updated file from Task 1).
  Copy the entire contents.
  In NEW project → SQL Editor → paste and run.
  Expected: no errors.

- [ ] **Step 2: Run RPC**
  Open `supabase-ai-query-rpc.sql`.
  Copy the entire contents.
  In NEW project → SQL Editor → paste and run.
  Expected: no errors.

---

## Task 10: MANUAL — Export and import customer data

> **Export runs in old project SQL Editor. Import runs in new project SQL Editor.**

- [ ] **Step 1: Run export queries in old project**
  Open `scripts/export-data.sql`.
  Replace `OLD_OWNER_ID` with the UUID from Task 8 Step 3.
  Run each `-- STEP N` block separately in the OLD project's SQL Editor.
  For each block, click the result table, then click "Copy to clipboard" or manually copy all rows.

- [ ] **Step 2: Build import SQL for new project**
  For each table's output, the result column `insert_stmt` contains INSERT statements with `NEW_OWNER_ID_HERE` as a placeholder.
  Replace `NEW_OWNER_ID_HERE` with the actual new UUID from Task 8 Step 5.

- [ ] **Step 3: Run imports in order in new project**
  In NEW project SQL Editor, run the INSERT statements in this order:
  1. `user_profiles` inserts
  2. `suppliers` inserts
  3. `bills` inserts
  4. `payments` inserts
  5. `ledger_entries` inserts

  Expected: each block runs with no errors.

- [ ] **Step 4: Verify row counts match**
  Run in both old and new projects and confirm counts match:
  ```sql
  SELECT
    (SELECT count(*) FROM suppliers WHERE owner_id = 'OWNER_ID') AS suppliers,
    (SELECT count(*) FROM bills WHERE owner_id = 'OWNER_ID') AS bills,
    (SELECT count(*) FROM payments WHERE owner_id = 'OWNER_ID') AS payments,
    (SELECT count(*) FROM ledger_entries WHERE owner_id = 'OWNER_ID') AS ledger_entries;
  ```
  Use `OLD_OWNER_ID` for old project and `bill_payments` instead of `payments`.
  Use `NEW_OWNER_ID` for new project.

---

## Task 11: Run storage migration

**Files:**
- Run: `scripts/migrate-storage.ts`

- [ ] **Step 1: Fill in credentials in `scripts/migrate-storage.ts`**

  Open the file and set:
  - `OLD_SERVICE_KEY` — from current `.env.local` `SUPABASE_SERVICE_ROLE_KEY`
  - `NEW_URL` — from Task 8 Step 2
  - `NEW_SERVICE_KEY` — from Task 8 Step 2
  - `OLD_OWNER_ID` — from Task 8 Step 3
  - `NEW_OWNER_ID` — from Task 8 Step 5

- [ ] **Step 2: Run the script**

  ```bash
  cd /c/Users/nirma/ledgerly
  npx tsx scripts/migrate-storage.ts
  ```

  Expected output: each file logs `OK   {old_path} → {new_path}`. No `FAIL` lines.

- [ ] **Step 3: Run the file_url fix SQL printed by the script**

  The script prints a `UPDATE bills SET file_url = ...` statement at the end.
  Copy it and run in the NEW project's SQL Editor.

- [ ] **Step 4: Verify files in new bucket**
  In NEW project → Storage → bills bucket.
  You should see the `NEW_OWNER_ID/` folder with all the migrated files.

---

## Task 12: Update env vars — web and mobile

**Files:**
- Modify: `.env.local`
- Modify: `../ledgerly-mobile/.env`

- [ ] **Step 1: Update `.env.local`**

  Replace the three Supabase values with new project values (keep ANTHROPIC_API_KEY and NEXT_PUBLIC_APP_URL unchanged):

  ```env
  NEXT_PUBLIC_SUPABASE_URL=<NEW_URL from Task 8 Step 2>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY from Task 8 Step 2>
  SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_KEY from Task 8 Step 2>
  ANTHROPIC_API_KEY=<unchanged>
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] **Step 2: Update `../ledgerly-mobile/.env`**

  Replace the two Supabase values (keep EXPO_PUBLIC_API_URL unchanged):

  ```env
  EXPO_PUBLIC_SUPABASE_URL=<NEW_URL from Task 8 Step 2>
  EXPO_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY from Task 8 Step 2>
  EXPO_PUBLIC_API_URL=https://yourledgerly.com
  ```

---

## Task 13: MANUAL — Update Vercel environment variables

> **Done in Vercel dashboard. No code changes.**

- [ ] **Step 1: Open Vercel project**
  Go to vercel.com → ledgerly project → Settings → Environment Variables.

- [ ] **Step 2: Update three variables for all environments (Production, Preview, Development)**

  Update each of these to the new values from Task 8 Step 2:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 3: Trigger a redeployment**
  Vercel dashboard → Deployments → three dots on latest deployment → "Redeploy".
  Wait for it to complete.

---

## Task 14: Push `ledgerly-mobile` to GitHub

- [ ] **Step 1: Create GitHub repo**
  Go to github.com → New repository
  - Name: `ledgerly-mobile`
  - Visibility: Private
  - No README, no .gitignore (repo must be empty)

- [ ] **Step 2: Add remote and push**

  ```bash
  cd /c/Users/nirma/ledgerly-mobile
  git remote add origin https://github.com/nirmalamin24bak/ledgerly-mobile.git
  git branch -M master
  git push -u origin master
  ```

  Expected: branch pushed, upstream set.

- [ ] **Step 3: Verify**

  ```bash
  git remote -v
  ```
  Expected:
  ```
  origin  https://github.com/nirmalamin24bak/ledgerly-mobile.git (fetch)
  origin  https://github.com/nirmalamin24bak/ledgerly-mobile.git (push)
  ```

---

## Task 15: Verify web app works end-to-end

- [ ] **Step 1: Start dev server**

  ```bash
  cd /c/Users/nirma/ledgerly
  npm run dev
  ```

- [ ] **Step 2: Log in as the customer**
  - Open http://localhost:3000
  - Log in with the customer's email (they will have set a password via the invite email)
  - Expected: dashboard loads with correct stats

- [ ] **Step 3: Verify data is present**
  - Suppliers page — list matches old data
  - Bills page — all bills present, file attachments open
  - Payments page — all payments present
  - Reports page — totals look correct

- [ ] **Step 4: Verify AI scan still works**
  - Upload a bill image on the Scan page
  - Expected: Claude extracts data, form populates

- [ ] **Step 5: Build check**

  ```bash
  npm run build
  ```
  Expected: no TypeScript errors, build succeeds.

---

## Task 16: Clean up migration scripts

- [ ] **Step 1: Delete migration scripts (one-time use)**

  ```bash
  cd /c/Users/nirma/ledgerly
  rm scripts/export-data.sql scripts/migrate-storage.ts
  rmdir scripts 2>/dev/null || true
  ```

- [ ] **Step 2: Commit final cleanup**

  ```bash
  git add -A
  git commit -m "chore: remove one-time migration scripts after Supabase separation

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

## Self-Review Checklist

- ✅ Schema rename: all `bill_payments` → `payments` in SQL (Task 1)
- ✅ Code rename: all 6 `.from('bill_payments')` references covered (Task 2)
- ✅ NL→SQL prompt updated in `lib/ai.ts` (Task 3)
- ✅ README updated (Task 3)
- ✅ CLAUDE.md workaround note removed (Task 4)
- ✅ Data export SQL covers all tables with correct column names (Task 6)
- ✅ Storage migration handles UUID path prefix change + SQL fix for file_url (Tasks 7, 11)
- ✅ Import order respects FK constraints: user_profiles → suppliers → bills → payments → ledger_entries (Task 10)
- ✅ Row count verification step included (Task 10)
- ✅ All 3 env var locations covered: web .env.local, mobile .env, Vercel dashboard (Tasks 12, 13)
- ✅ Mobile git remote setup (Task 14)
- ✅ End-to-end verification includes login, data, file attachments, AI scan, and build (Task 15)
- ✅ Migration scripts cleaned up after use (Task 16)
