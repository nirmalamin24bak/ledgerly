import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface SupplierBalance {
  id: string
  name: string
  category: string | null
  outstanding: number
}

export default function TopSuppliers({ suppliers }: { suppliers: SupplierBalance[] }) {
  if (!suppliers.length) {
    return (
      <div className="card p-6 text-center text-gray-400 text-sm">
        No supplier data yet.
      </div>
    )
  }

  const max = suppliers[0]?.outstanding ?? 1

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-gray-100">
        {suppliers.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="text-xs font-medium text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <Link href={`/suppliers/${s.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-900 truncate block">
                {s.name}
              </Link>
              {s.category && (
                <span className="text-xs text-gray-400 capitalize">{s.category}</span>
              )}
              {/* Progress bar */}
              <div className="mt-1 h-1 rounded-full bg-gray-100">
                <div
                  className="h-1 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(100, (s.outstanding / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {formatCurrency(s.outstanding)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
