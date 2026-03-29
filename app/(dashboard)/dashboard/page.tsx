import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardStats, BillWithSupplier } from '@/types'
import StatsCards from '@/components/dashboard/stats-cards'
import RecentBills from '@/components/dashboard/recent-bills'
import TopSuppliers from '@/components/dashboard/top-suppliers'
import MonthlySpendChart from '@/components/dashboard/monthly-spend-chart'
import BillStatusChart from '@/components/dashboard/bill-status-chart'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)

  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [
    { data: bills },
    { data: suppliers },
    { data: recentBills },
    { data: ledgerBalances },
  ] = await Promise.all([
    supabase
      .from('bills')
      .select('total_amount, status, due_date, invoice_date')
      .in('owner_id', ownerIds),
    supabase
      .from('suppliers')
      .select('id')
      .in('owner_id', ownerIds),
    supabase
      .from('bills')
      .select('*, supplier:suppliers(id, name, gst_number, category)')
      .in('owner_id', ownerIds)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ledger_entries')
      .select('supplier_id, running_balance')
      .in('owner_id', ownerIds)
      .order('created_at', { ascending: false }),
  ])

  // ── Stats ──────────────────────────────────────────────────────
  const pendingBills = bills?.filter(b => b.status !== 'paid') ?? []
  const total_outstanding = pendingBills.reduce((s, b) => s + Number(b.total_amount), 0)
  const overdueBills = pendingBills.filter(b => b.due_date && b.due_date < today)
  const overdue_amount = overdueBills.reduce((s, b) => s + Number(b.total_amount), 0)
  const thisMonthBills = pendingBills.filter(b => b.due_date && b.due_date >= monthStart && b.due_date <= monthEnd)
  const this_month_payable = thisMonthBills.reduce((s, b) => s + Number(b.total_amount), 0)

  const stats: DashboardStats = {
    total_outstanding,
    this_month_payable,
    overdue_amount,
    total_suppliers: suppliers?.length ?? 0,
    pending_bills_count: pendingBills.length,
    overdue_bills_count: overdueBills.length,
  }

  // ── Monthly spend (last 6 months) ──────────────────────────────
  const monthlySpend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const amount = bills
      ?.filter(b => b.invoice_date?.startsWith(key))
      .reduce((s, b) => s + Number(b.total_amount), 0) ?? 0
    return { month: label, amount }
  })

  // ── Bill status breakdown ──────────────────────────────────────
  const sumBy = (status: string) =>
    bills?.filter(b => b.status === status).reduce((s, b) => s + Number(b.total_amount), 0) ?? 0

  const billStatusData = [
    { name: 'Paid',    value: sumBy('paid'),    color: '#10b981' },
    { name: 'Pending', value: sumBy('pending'), color: '#f59e0b' },
    { name: 'Partial', value: sumBy('partial'), color: '#6366f1' },
  ].filter(d => d.value > 0)

  // ── Top suppliers ──────────────────────────────────────────────
  const latestBySupplier = new Map<string, number>()
  for (const entry of ledgerBalances ?? []) {
    if (!latestBySupplier.has(entry.supplier_id)) {
      latestBySupplier.set(entry.supplier_id, Number(entry.running_balance))
    }
  }

  const topSupplierIds = [...latestBySupplier.entries()]
    .filter(([, balance]) => balance > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const { data: topSupplierData } = await supabase
    .from('suppliers')
    .select('id, name, category')
    .in('id', topSupplierIds.length > 0 ? topSupplierIds : ['00000000-0000-0000-0000-000000000000'])

  const topSuppliers = topSupplierIds.map(id => {
    const s = topSupplierData?.find(s => s.id === id)
    return { id, name: s?.name ?? 'Unknown', category: s?.category ?? null, outstanding: latestBySupplier.get(id) ?? 0 }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/suppliers" className="btn-secondary">
            <Plus className="w-4 h-4" /> Supplier
          </Link>
          <Link href="/bills/upload" className="btn-primary">
            <Upload className="w-4 h-4" /> Upload Bill
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend */}
        <div className="lg:col-span-2 card p-5">
          <p className="section-title mb-1">Monthly Spend</p>
          <p className="text-xs text-gray-400 mb-4">Total billed per month (last 6 months)</p>
          <MonthlySpendChart data={monthlySpend} />
        </div>

        {/* Bill Status Donut */}
        <div className="card p-5">
          <p className="section-title mb-1">Bills by Status</p>
          <p className="text-xs text-gray-400 mb-4">By total amount</p>
          <BillStatusChart data={billStatusData} />
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Bills</h2>
            <Link href="/bills" className="text-sm text-blue-900 hover:underline font-medium">View all</Link>
          </div>
          <RecentBills bills={(recentBills as BillWithSupplier[]) ?? []} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Top Outstanding</h2>
            <Link href="/suppliers" className="text-sm text-blue-900 hover:underline font-medium">View all</Link>
          </div>
          <TopSuppliers suppliers={topSuppliers} />
        </div>
      </div>
    </div>
  )
}
