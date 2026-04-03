import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PaymentsClient from './payments-client'

export default async function PaymentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)
  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  const activeProjectId = cookies().get('ledgerly_project_id')?.value

  let paymentsQuery = supabase
    .from('payments')
    .select('*, supplier:suppliers(id, name), bill:bills(id, invoice_number)')
    .in('owner_id', ownerIds)
    .order('payment_date', { ascending: false })

  let suppliersQuery = supabase
    .from('suppliers')
    .select('id, name')
    .in('owner_id', ownerIds)
    .order('name', { ascending: true })

  if (activeProjectId) {
    paymentsQuery = paymentsQuery.eq('project_id', activeProjectId)
    suppliersQuery = suppliersQuery.eq('project_id', activeProjectId)
  }

  const [{ data: payments }, { data: suppliers }] = await Promise.all([paymentsQuery, suppliersQuery])

  return <PaymentsClient payments={payments ?? []} suppliers={suppliers ?? []} />
}
