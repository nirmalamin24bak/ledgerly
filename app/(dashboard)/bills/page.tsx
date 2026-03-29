import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillsClient from './bills-client'

export default async function BillsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)
  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  const [{ data: bills }, { data: suppliers }] = await Promise.all([
    supabase
      .from('bills')
      .select('*, supplier:suppliers(id, name, gst_number, category)')
      .in('owner_id', ownerIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('suppliers')
      .select('id, name, category')
      .in('owner_id', ownerIds)
      .order('name', { ascending: true }),
  ])

  return <BillsClient bills={bills ?? []} suppliers={suppliers ?? []} />
}
