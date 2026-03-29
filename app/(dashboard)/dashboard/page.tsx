import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardStats, BillWithSupplier } from '@/types'
import StatsCards from '@/components/dashboard/stats-cards'
import RecentBills from '@/components/dashboard/recent-bills'
import TopSuppliers from '@/components/dashboard/top-suppliers'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get owner IDs this user can access
  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('owner_id')
    .eq('accountant_id', user.id)

  const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

  // Parallel queries
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
      .select('total_amount, status, due_date')
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

  // Calculate stats
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

  // Top suppliers by outstanding balance (latest ledger entry per supplier)
  const latestBySupplier = new Map<string, number>()
  for (const entry of ledgerBalances ?? []) {
    if (!latestBySupplier.has(entry.supplier_id)) {
      latestBySupplier.set(entry.supplier_id, Number(entry.running_balance))
    }
  }

  // Get supplier names for top ones
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
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

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills — 2/3 width */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Bills</h2>
            <Link href="/bills" className="text-sm text-amber-600 hover:underline">View all</Link>
          </div>
          <RecentBills bills={(recentBills as BillWithSupplier[]) ?? []} />
        </div>

        {/* Top Suppliers — 1/3 width */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Outstanding</h2>
            <Link href="/suppliers" className="text-sm text-amber-600 hover:underline">View all</Link>
          </div>
          <TopSuppliers suppliers={topSuppliers} />
        </div>
      </div>
    </div>
  )
}
