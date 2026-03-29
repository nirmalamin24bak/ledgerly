import { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, TrendingUp, Clock, Users } from 'lucide-react'

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: 'Total Outstanding',
      value: formatCurrency(stats.total_outstanding),
      sub: `${stats.pending_bills_count} pending bills`,
      icon: TrendingUp,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-gray-900',
    },
    {
      label: 'This Month Payable',
      value: formatCurrency(stats.this_month_payable),
      sub: 'Due this month',
      icon: Clock,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      valueColor: 'text-gray-900',
    },
    {
      label: 'Overdue Amount',
      value: formatCurrency(stats.overdue_amount),
      sub: `${stats.overdue_bills_count} overdue bills`,
      icon: AlertCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      valueColor: stats.overdue_amount > 0 ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: 'Active Suppliers',
      value: stats.total_suppliers.toString(),
      sub: 'Total suppliers',
      icon: Users,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-gray-900',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className={`stat-value mt-2 ${card.valueColor}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1.5">{card.sub}</p>
            </div>
            <div className={`${card.iconBg} p-2.5 rounded-lg shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
