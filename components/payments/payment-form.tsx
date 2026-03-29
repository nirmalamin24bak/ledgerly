'use client'

import { useState } from 'react'
import { BillWithSupplier, Supplier } from '@/types'
import { formatCurrency, PAYMENT_MODES } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'

interface Props {
  bill?: BillWithSupplier | null
  supplier?: Pick<Supplier, 'id' | 'name'>
  allSuppliers?: Pick<Supplier, 'id' | 'name'>[]
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentForm({ bill, supplier, allSuppliers, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    supplier_id: supplier?.id ?? bill?.supplier_id ?? '',
    bill_id: bill?.id ?? '',
    amount: bill ? (Number(bill.total_amount) - Number(bill.tds_amount)).toFixed(2) : '',
    payment_date: today,
    mode: 'neft',
    reference_number: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          bill_id: form.bill_id || null,
          reference_number: form.reference_number || null,
          notes: form.notes || null,
        }),
      })

      const data = await res.json()
      if (!data.success) { setError(data.error ?? 'Failed to record payment'); return }
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displaySupplier = supplier?.name ?? bill?.supplier?.name ?? 'Selected Supplier'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {bill && (
          <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm">
            <div className="font-medium text-amber-900">{displaySupplier}</div>
            <div className="text-amber-700">Invoice: {bill.invoice_number ?? 'N/A'} · Total: {formatCurrency(Number(bill.total_amount))}</div>
            {Number(bill.tds_amount) > 0 && (
              <div className="text-amber-600 text-xs mt-1">TDS deduction: {formatCurrency(Number(bill.tds_amount))} · Net payable: {formatCurrency(Number(bill.total_amount) - Number(bill.tds_amount))}</div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!bill && allSuppliers && (
            <div>
              <label className="label">Supplier *</label>
              <select className="input" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} required>
                <option value="">Select supplier...</option>
                {allSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Amount (₹) *</label>
            <input className="input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required min="0.01" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Date *</label>
              <input className="input" type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Mode *</label>
              <select className="input" value={form.mode} onChange={e => set('mode', e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Reference Number</label>
            <input className="input" value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="Cheque no. / UTR no." />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional remarks" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
