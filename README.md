# Ledgerly

**AI-powered bill scanning and supplier ledger for construction businesses in India.**

Upload a bill image → Claude reads it → supplier ledger updates automatically.

---

## Features

| Feature | Details |
|---|---|
| **AI Bill Scanning** | Upload JPG/PNG bills; Claude claude-opus-4-6 extracts supplier, GST, invoice #, CGST/SGST/IGST, TDS |
| **Supplier Ledger** | Running balance auto-calculated on every bill (debit) and payment (credit) |
| **GST Tracking** | Per-bill CGST/SGST/IGST breakdown + monthly summary report |
| **TDS Tracking** | Auto-detected from bills, deducted from net payable |
| **AI Query** | Ask in plain English — "How much do I owe ABC Steel?" |
| **Overdue Alerts** | Overdue bills flagged in red across dashboard and bills list |
| **Role-Based Access** | Owner + Accountant roles; accountant sees all data, cannot delete |
| **Secure** | Row-Level Security on all tables; service-role only for storage/ledger |

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes (server-side only)
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (`bills` bucket)
- **AI**: Anthropic Claude claude-opus-4-6 (vision) + claude-sonnet-4-6 (NL→SQL)
- **Hosting**: Vercel

---

## Project Structure

```
app/
  (auth)/login/          # Login + signup page
  (dashboard)/
    dashboard/           # Stats, recent bills, top suppliers
    suppliers/           # Supplier list + detail with ledger
    bills/               # Bill list + upload with AI scan
    payments/            # Payment history
    reports/             # Monthly GST summary + AI query
  api/
    scan-bill/           # Claude vision extraction
    bills/               # CRUD
    suppliers/           # CRUD
    payments/            # CRUD + ledger entry
    ai-query/            # NL → SQL via Claude
components/
lib/
  ai.ts                  # Claude integration (extractBillData, nlToSql)
  ledger.ts              # Running balance logic
  supabase/              # client.ts, server.ts
types/index.ts
```

---

## Getting Started

### 1. Clone & install
```bash
git clone https://github.com/nirmalamin24bak/ledgerly.git
cd ledgerly
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database setup
Run these in Supabase → **SQL Editor** in order:
1. `supabase-schema.sql` — tables, indexes, RLS, triggers
2. `supabase-ai-query-rpc.sql` — AI query function

### 4. Storage bucket
Supabase → **Storage** → New bucket → name: `bills` → **private**

Add these policies to the bucket (Storage → Policies):
```sql
-- Upload
CREATE POLICY "auth users upload bills" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bills' AND auth.uid() IS NOT NULL);

-- Read
CREATE POLICY "auth users read bills" ON storage.objects
  FOR SELECT USING (bucket_id = 'bills' AND auth.uid() IS NOT NULL);
```

### 5. Run locally
```bash
npm run dev
# → http://localhost:3000
```

Sign up → you're in. AI scanning requires `ANTHROPIC_API_KEY`.

---

## Deployment (Vercel)

```bash
npx vercel --prod
```

Set all environment variables in Vercel → Settings → Environment Variables.

> **Note**: Bill PDFs are not supported yet — upload JPG or PNG. PDF support requires a render step (planned).

---

## Database Schema

```
user_profiles     → extends auth.users (name, role)
suppliers         → name, gst_number, category, owner_id
bills             → invoice data, GST breakdown, TDS, file_url
bill_payments     → amount, mode, reference, links to bill
ledger_entries    → debit/credit with running_balance per supplier
accountant_access → owner grants accountant access
```

---

## License

MIT — see [LICENSE](LICENSE)
