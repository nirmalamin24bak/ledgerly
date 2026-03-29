import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatCurrency, formatDate, statusColor, isOverdue } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import LedgerBalanceChart from '@/components/suppliers/ledger-balance-chart'

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: supplier }, { data: bills }, { data: payments }, { data: ledger }] = await Promise.all([
    supabase.from('suppliers').select('*').eq('id', params.id).single(),
    supabase.from('bills').select('*').eq('supplier_id', params.id).order('invoice_date', { ascending: false }),
    supabase.from('bill_payments').select('*').eq('supplier_id', params.id).order('payment_date', { ascending: false }),
    supabase.from('ledger_entries').select('*').eq('supplier_id', params.id).order('entry_date', { ascending: false }),
  ])

  if (!supplier) notFound()

  const latestBalance = ledger?.[0]?.running_balance ?? 0
  const today = new Date().toISOString().split('T')[0]

  // Chart: chronological balance trend (last 30 entries)
  const ledgerTrend = [...(ledger ?? [])]
    .reverse()
    .slice(-30)
    .map(e => ({ date: e.entry_date, balance: Number(e.running_balance) }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              {supplier.gst_number && <span className="font-mono">{supplier.gst_number}</span>}
              {supplier.category && <span className="capitalize badge bg-gray-100 text-gray-600">{supplier.category}</span>}
              {supplier.phone && <span>{supplier.phone}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className={`text-2xl font-bold ${Number(latestBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Number(latestBalance))}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Trend Chart */}
      <LedgerBalanceChart data={ledgerTrend} />

      {/* Tabs-style section: Bills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Bills ({bills?.length ?? 0})</h2>
          <Link href={`/bills/upload?supplier=${params.id}`} className="btn-primary text-xs px-3 py-1.5">
            + New Bill
          </Link>
        </div>
        <div className="card overflow-hidden">
          {!bills?.length ? (
            <div className="p-8 text-center text-gray-400 text-sm">No bills for this supplier.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Due Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">GST</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map(b => (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.invoice_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.invoice_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 ${isOverdue(b.due_date) && b.status !== 'paid' ? 'text-red-600' : 'text-gray-600'}`}>
                        {isOverdue(b.due_date) && b.status !== 'paid' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {formatDate(b.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(b.total_amount))}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(b.gst_amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColor(b.status)} capitalize`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Payments ({payments?.length ?? 0})</h2>
        <div className="card overflow-hidden">
          {!payments?.length ? (
            <div className="p-8 text-center text-gray-400 text-sm">No payments recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 uppercase text-xs font-medium text-gray-600">{p.mode}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.reference_number ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ledger */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Ledger Statement</h2>
        <div className="card overflow-hidden">
          {!ledger?.length ? (
            <div className="p-8 text-center text-gray-400 text-sm">No ledger entries yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Debit</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Credit</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...ledger].reverse().map(entry => (
                  <tr key={entry.id} className="table-row-hover">
                    <td className="px-4 py-3 text-gray-600">{formatDate(entry.entry_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{entry.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {entry.type === 'debit' ? formatCurrency(Number(entry.amount)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {entry.type === 'credit' ? formatCurrency(Number(entry.amount)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(Number(entry.running_balance))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={4} className="px-4 py-3 font-semibold text-gray-700 text-right">Current Balance</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">
                    {formatCurrency(Number(latestBalance))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
