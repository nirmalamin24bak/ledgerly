import Link from 'next/link'
import { BillWithSupplier } from '@/types'
import { formatCurrency, formatDate, statusColor, isOverdue } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default function RecentBills({ bills }: { bills: BillWithSupplier[] }) {
  if (!bills.length) {
    return (
      <div className="card p-8 text-center text-gray-400 text-sm">
        No bills yet.{' '}
        <Link href="/bills/upload" className="text-blue-900 hover:underline font-medium">Upload your first bill</Link>.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="table-th">Supplier</th>
            <th className="table-th">Invoice #</th>
            <th className="table-th">Date</th>
            <th className="table-th">Due</th>
            <th className="table-th text-right">Amount</th>
            <th className="table-th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {bills.map((bill) => (
            <tr key={bill.id} className="table-row-hover">
              <td className="table-td">
                <Link href={`/suppliers/${bill.supplier_id}`} className="font-medium text-gray-900 hover:text-blue-900">
                  {bill.supplier.name}
                </Link>
                {bill.supplier.category && (
                  <span className="ml-2 text-xs text-gray-400 capitalize">{bill.supplier.category}</span>
                )}
              </td>
              <td className="table-td font-mono text-xs text-gray-500">
                {bill.invoice_number ?? '—'}
              </td>
              <td className="table-td text-gray-500">{formatDate(bill.invoice_date)}</td>
              <td className="table-td">
                <span className={`flex items-center gap-1 ${isOverdue(bill.due_date) && bill.status !== 'paid' ? 'text-red-500' : 'text-gray-500'}`}>
                  {isOverdue(bill.due_date) && bill.status !== 'paid' && (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {formatDate(bill.due_date)}
                </span>
              </td>
              <td className="table-td text-right num font-semibold text-gray-900">
                {formatCurrency(bill.total_amount)}
              </td>
              <td className="table-td">
                <span className={`badge ${statusColor(bill.status)} capitalize`}>{bill.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
