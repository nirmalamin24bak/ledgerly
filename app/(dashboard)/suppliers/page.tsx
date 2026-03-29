import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuppliersClient from './suppliers-client'

export default async function SuppliersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)

  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .in('owner_id', ownerIds)
    .order('name', { ascending: true })

  // Get outstanding balance per supplier from latest ledger entry
  const { data: ledger } = await supabase
    .from('ledger_entries')
    .select('supplier_id, running_balance')
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })

  const balanceMap = new Map<string, number>()
  for (const entry of ledger ?? []) {
    if (!balanceMap.has(entry.supplier_id)) {
      balanceMap.set(entry.supplier_id, Number(entry.running_balance))
    }
  }

  const suppliersWithBalance = (suppliers ?? []).map(s => ({
    ...s,
    outstanding_balance: balanceMap.get(s.id) ?? 0,
  }))

  return <SuppliersClient suppliers={suppliersWithBalance} isOwner={true} />
}
