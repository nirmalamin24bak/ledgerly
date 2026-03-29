'use client'

import { useState } from 'react'
import { PaymentWithSupplier, Supplier } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import PaymentForm from '@/components/payments/payment-form'

interface Props {
  payments: PaymentWithSupplier[]
  suppliers: Pick<Supplier, 'id' | 'name'>[]
}

export default function PaymentsClient({ payments, suppliers }: Props) {
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = payments.filter(p => {
    const matchSearch = !search ||
      p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(search.toLowerCase())
    const matchMode = !modeFilter || p.mode === modeFilter
    const matchSupplier = !supplierFilter || p.supplier_id === supplierFilter
    return matchSearch && matchMode && matchSupplier
  })

  const totalPaid = filtered.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-sm text-gray-500">{payments.length} total payments</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search supplier or reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
            <option value="">All suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input w-auto" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="">All modes</option>
            {['cash', 'cheque', 'neft', 'rtgs', 'upi', 'other'].map(m => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {filtered.length > 0 && (
          <div className="text-sm text-gray-500 px-1">
            {filtered.length} payments · Total: <strong className="text-gray-900">{formatCurrency(totalPaid)}</strong>
          </div>
        )}

        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {payments.length === 0
                ? 'No payments recorded yet.'
                : 'No payments match your filters.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Bill</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.supplier.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.bill?.invoice_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-700 uppercase">{p.mode}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.reference_number ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <PaymentForm
          allSuppliers={suppliers}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); window.location.reload() }}
        />
      )}
    </>
  )
}
