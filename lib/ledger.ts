import { createServiceClient } from './supabase/server'

/**
 * Creates a ledger entry and recalculates running balance for the supplier.
 * Call this after inserting a bill (debit) or payment (credit).
 */
export async function createLedgerEntry({
  supplier_id,
  owner_id,
  type,
  reference_type,
  reference_id,
  amount,
  entry_date,
  description,
}: {
  supplier_id: string
  owner_id: string
  type: 'debit' | 'credit'
  reference_type: 'bill' | 'payment'
  reference_id: string
  amount: number
  entry_date: string
  description?: string
}) {
  const supabase = createServiceClient()

  // Get current running balance for this supplier
  const { data: lastEntry } = await supabase
    .from('ledger_entries')
    .select('running_balance')
    .eq('supplier_id', supplier_id)
    .eq('owner_id', owner_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const previousBalance = lastEntry?.running_balance ?? 0
  // Debit increases outstanding (you owe more), credit decreases it
  const running_balance =
    type === 'debit'
      ? previousBalance + amount
      : previousBalance - amount

  const { error } = await supabase.from('ledger_entries').insert({
    supplier_id,
    owner_id,
    type,
    reference_type,
    reference_id,
    amount,
    running_balance,
    entry_date,
    description: description ?? (type === 'debit' ? 'Bill raised' : 'Payment made'),
  })

  if (error) throw new Error(`Ledger entry failed: ${error.message}`)

  return running_balance
}

/**
 * Recalculates the running balance for all entries of a supplier from scratch.
 * Use this for corrections/reconciliation.
 */
export async function recalculateSupplierLedger(supplier_id: string, owner_id: string) {
  const supabase = createServiceClient()

  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('supplier_id', supplier_id)
    .eq('owner_id', owner_id)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!entries?.length) return

  let balance = 0
  for (const entry of entries) {
    balance = entry.type === 'debit' ? balance + entry.amount : balance - entry.amount
    await supabase
      .from('ledger_entries')
      .update({ running_balance: balance })
      .eq('id', entry.id)
  }
}

/**
 * Gets the current outstanding balance for a supplier.
 */
export async function getSupplierBalance(supplier_id: string, owner_id: string): Promise<number> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('ledger_entries')
    .select('running_balance')
    .eq('supplier_id', supplier_id)
    .eq('owner_id', owner_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.running_balance ?? 0
}
