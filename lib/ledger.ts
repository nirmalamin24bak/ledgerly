import { createServiceClient } from './supabase/server'

/**
 * Creates a ledger entry atomically via a PostgreSQL function.
 * The DB function uses SELECT ... FOR UPDATE to prevent race conditions
 * where two concurrent requests could both read the same running_balance.
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
}): Promise<number> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('create_ledger_entry', {
    p_supplier_id: supplier_id,
    p_owner_id: owner_id,
    p_type: type,
    p_reference_type: reference_type,
    p_reference_id: reference_id,
    p_amount: amount,
    p_entry_date: entry_date,
    p_description: description ?? (type === 'debit' ? 'Bill raised' : 'Payment made'),
  })

  if (error) throw new Error(`Ledger entry failed: ${error.message}`)
  return data as number
}

/**
 * Recalculates the running balance for all entries of a supplier from scratch.
 * Use this for corrections/reconciliation only — not on normal request paths.
 */
export async function recalculateSupplierLedger(supplier_id: string, owner_id: string) {
  const supabase = createServiceClient()

  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('id, type, amount')
    .eq('supplier_id', supplier_id)
    .eq('owner_id', owner_id)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!entries?.length) return

  // Build all updates in memory, then batch — avoid N individual UPDATE calls
  let balance = 0
  const updates = entries.map(entry => {
    balance = entry.type === 'debit' ? balance + Number(entry.amount) : balance - Number(entry.amount)
    return { id: entry.id, running_balance: balance }
  })

  // Update in a single upsert
  const { error: updateError } = await supabase
    .from('ledger_entries')
    .upsert(updates, { onConflict: 'id' })

  if (updateError) throw updateError
}

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
