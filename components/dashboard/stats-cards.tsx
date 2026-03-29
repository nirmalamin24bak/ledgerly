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
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      label: 'This Month Payable',
      value: formatCurrency(stats.this_month_payable),
      sub: 'Due this month',
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
    },
    {
      label: 'Overdue Amount',
      value: formatCurrency(stats.overdue_amount),
      sub: `${stats.overdue_bills_count} overdue bills`,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
    },
    {
      label: 'Active Suppliers',
      value: stats.total_suppliers.toString(),
      sub: 'Total suppliers',
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
            <div className={`${card.bgLight} p-2.5 rounded-lg`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
