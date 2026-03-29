import Link from 'next/link'
import { BillWithSupplier } from '@/types'
import { formatCurrency, formatDate, statusColor, isOverdue } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default function RecentBills({ bills }: { bills: BillWithSupplier[] }) {
  if (!bills.length) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <p>No bills yet. <Link href="/bills/upload" className="text-amber-600 hover:underline">Upload your first bill</Link>.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Supplier</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Due Date</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bills.map((bill) => (
            <tr key={bill.id} className="table-row-hover">
              <td className="px-4 py-3">
                <Link
                  href={`/suppliers/${bill.supplier_id}`}
                  className="font-medium text-gray-900 hover:text-amber-600"
                >
                  {bill.supplier.name}
                </Link>
                {bill.supplier.category && (
                  <span className="ml-2 text-xs text-gray-400 capitalize">{bill.supplier.category}</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                <Link href={`/bills`} className="hover:text-amber-600">
                  {bill.invoice_number ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(bill.invoice_date)}</td>
              <td className="px-4 py-3">
                <span className={`flex items-center gap-1 ${isOverdue(bill.due_date) && bill.status !== 'paid' ? 'text-red-600' : 'text-gray-500'}`}>
                  {isOverdue(bill.due_date) && bill.status !== 'paid' && (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {formatDate(bill.due_date)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatCurrency(bill.total_amount)}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${statusColor(bill.status)} capitalize`}>
                  {bill.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
