import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './reports-client'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)
  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  // Monthly GST summary
  const now = new Date()
  const year = now.getFullYear()

  const { data: bills } = await supabase
    .from('bills')
    .select('invoice_date, total_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, gst_amount, tds_amount, tds_applicable, status, supplier:suppliers(name, category)')
    .in('owner_id', ownerIds)
    .gte('invoice_date', `${year}-01-01`)
    .order('invoice_date', { ascending: true })

  // Group by month
  const monthlyMap = new Map<string, {
    month: string
    bills: number
    taxable: number
    cgst: number
    sgst: number
    igst: number
    total_gst: number
    tds: number
    total: number
  }>()

  for (const b of bills ?? []) {
    if (!b.invoice_date) continue
    const month = b.invoice_date.substring(0, 7) // YYYY-MM
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { month, bills: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total_gst: 0, tds: 0, total: 0 })
    }
    const m = monthlyMap.get(month)!
    m.bills++
    m.taxable += Number(b.taxable_amount)
    m.cgst += Number(b.cgst_amount)
    m.sgst += Number(b.sgst_amount)
    m.igst += Number(b.igst_amount)
    m.total_gst += Number(b.gst_amount)
    m.tds += Number(b.tds_amount)
    m.total += Number(b.total_amount)
  }

  const monthlySummary = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month))

  // Category-wise outstanding
  const { data: ledger } = await supabase
    .from('ledger_entries')
    .select('supplier_id, running_balance')
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })

  const balanceMap = new Map<string, number>()
  for (const e of ledger ?? []) {
    if (!balanceMap.has(e.supplier_id)) balanceMap.set(e.supplier_id, Number(e.running_balance))
  }

  const { data: suppliersData } = await supabase
    .from('suppliers')
    .select('id, name, category')
    .in('owner_id', ownerIds)

  const categoryMap = new Map<string, number>()
  for (const s of suppliersData ?? []) {
    const cat = s.category ?? 'other'
    const balance = balanceMap.get(s.id) ?? 0
    if (balance > 0) categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + balance)
  }
  const categoryOutstanding = [...categoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <ReportsClient
      monthlySummary={monthlySummary}
      categoryOutstanding={categoryOutstanding}
      year={year}
    />
  )
}
