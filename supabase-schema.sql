-- ============================================================
-- LEDGERLY — DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'owner'
                  CHECK (role IN ('owner', 'accountant')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Accountant access (owner grants accountant access to their data)
CREATE TABLE accountant_access (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accountant_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, accountant_id)
);

-- Suppliers
CREATE TABLE suppliers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  gst_number  TEXT,
  category    TEXT,   -- steel, rmc, labour, cement, sand, electrical, plumbing, other
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bills (invoices received from suppliers)
CREATE TABLE bills (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id         UUID REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  owner_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number      TEXT,
  invoice_date        DATE,
  due_date            DATE,
  total_amount        DECIMAL(15, 2) NOT NULL DEFAULT 0,
  gst_amount          DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cgst_amount         DECIMAL(15, 2) NOT NULL DEFAULT 0,
  sgst_amount         DECIMAL(15, 2) NOT NULL DEFAULT 0,
  igst_amount         DECIMAL(15, 2) NOT NULL DEFAULT 0,
  taxable_amount      DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tds_applicable      BOOLEAN NOT NULL DEFAULT FALSE,
  tds_rate            DECIMAL(5, 2),
  tds_amount          DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'partial')),
  file_url            TEXT,
  file_name           TEXT,
  notes               TEXT,
  raw_extracted_data  JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Payments made to suppliers
CREATE TABLE payments (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id       UUID REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  bill_id           UUID REFERENCES bills(id) ON DELETE SET NULL,
  owner_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount            DECIMAL(15, 2) NOT NULL,
  payment_date      DATE NOT NULL,
  mode              TEXT NOT NULL
                      CHECK (mode IN ('cash', 'cheque', 'neft', 'rtgs', 'upi', 'other')),
  reference_number  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Running ledger per supplier
CREATE TABLE ledger_entries (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  owner_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  reference_type  TEXT NOT NULL CHECK (reference_type IN ('bill', 'payment')),
  reference_id    UUID NOT NULL,
  amount          DECIMAL(15, 2) NOT NULL,
  running_balance DECIMAL(15, 2) NOT NULL,
  entry_date      DATE NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_suppliers_owner        ON suppliers(owner_id);
CREATE INDEX idx_bills_owner            ON bills(owner_id);
CREATE INDEX idx_bills_supplier         ON bills(supplier_id);
CREATE INDEX idx_bills_status           ON bills(status);
CREATE INDEX idx_bills_invoice_date     ON bills(invoice_date);
CREATE INDEX idx_bills_due_date         ON bills(due_date);
CREATE INDEX idx_payments_owner         ON payments(owner_id);
CREATE INDEX idx_payments_supplier      ON payments(supplier_id);
CREATE INDEX idx_payments_bill          ON payments(bill_id);
CREATE INDEX idx_ledger_supplier        ON ledger_entries(supplier_id);
CREATE INDEX idx_ledger_owner           ON ledger_entries(owner_id);
CREATE INDEX idx_ledger_entry_date      ON ledger_entries(entry_date);
CREATE INDEX idx_accountant_owner       ON accountant_access(owner_id);
CREATE INDEX idx_accountant_accountant  ON accountant_access(accountant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountant_access ENABLE ROW LEVEL SECURITY;

-- Helper function: returns owner_ids that the current user can access
-- (either their own data, or data of owners who granted them accountant access)
CREATE OR REPLACE FUNCTION accessible_owner_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT auth.uid()
  UNION
  SELECT owner_id FROM accountant_access WHERE accountant_id = auth.uid()
$$;

-- user_profiles
CREATE POLICY "users can read own profile"
  ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users can update own profile"
  ON user_profiles FOR UPDATE USING (id = auth.uid());

-- suppliers
CREATE POLICY "read accessible suppliers"
  ON suppliers FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "owner insert supplier"
  ON suppliers FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update supplier"
  ON suppliers FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "owner delete supplier"
  ON suppliers FOR DELETE USING (owner_id = auth.uid());

-- bills
CREATE POLICY "read accessible bills"
  ON bills FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "insert bill"
  ON bills FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update bill"
  ON bills FOR UPDATE USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "delete bill"
  ON bills FOR DELETE USING (owner_id = auth.uid());

-- payments
CREATE POLICY "read accessible payments"
  ON payments FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "insert payment"
  ON payments FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update payment"
  ON payments FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "delete payment"
  ON payments FOR DELETE USING (owner_id = auth.uid());

-- ledger_entries
CREATE POLICY "read accessible ledger"
  ON ledger_entries FOR SELECT USING (owner_id IN (SELECT accessible_owner_ids()));
CREATE POLICY "insert ledger"
  ON ledger_entries FOR INSERT WITH CHECK (owner_id = auth.uid());

-- accountant_access
CREATE POLICY "owner manages their accountants"
  ON accountant_access FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "accountant sees their access rows"
  ON accountant_access FOR SELECT USING (accountant_id = auth.uid());

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- STORAGE BUCKET (run this separately or via Supabase dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('bills', 'bills', false);
--
-- CREATE POLICY "auth users upload bills"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'bills' AND auth.uid() IS NOT NULL);
--
-- CREATE POLICY "auth users read own bills"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'bills' AND auth.uid() IS NOT NULL);

-- ============================================================
-- SCAN USAGE (plan-gated monthly scan counter)
-- Run AFTER applying the main schema above
-- ============================================================

CREATE TABLE scan_usage (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,  -- e.g. '2026-04'
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan usage"
  ON scan_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic upsert-increment called by service role (bypasses RLS)
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID, p_year_month TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO scan_usage (user_id, year_month, count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET count = scan_usage.count + 1;
END;
$$;
