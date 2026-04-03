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
  'INSERT INTO bills (id, supplier_id, owner_id, invoice_number, invoice_date, due_date, total_amount, gst_amount, cgst_amount, sgst_amount, igst_amount, taxable_amount, tds_applicable, tds_rate, tds_amount, status, file_url, file_name, notes, raw_extracted_data, created_at, updated_at) VALUES (' ||
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
  COALESCE(quote_literal(raw_extracted_data::text), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' AS insert_stmt
FROM bills
WHERE owner_id = 'OLD_OWNER_ID';

-- ---- STEP 4: Export payments ----
-- NOTE: old project table is still named bill_payments
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

-- ---- NOTE: accountant_access is NOT exported automatically ----
-- If the customer has granted accountant access to team members, those
-- accountants must be manually re-invited to the new project and access
-- re-granted via Authentication > Users > Invite, then re-adding them
-- in the Ledgerly app Settings > Team page.
-- The old accountant UUIDs reference the old auth.users and cannot be
-- migrated directly (FK constraint would fail).
