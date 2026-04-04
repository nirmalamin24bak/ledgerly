'use client'

import { useState } from 'react'
import { BillWithSupplier } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'

interface Props {
  bill: BillWithSupplier
  onClose: () => void
  onSuccess: (updatedBill: BillWithSupplier) => void
}

export default function BillEditForm({ bill, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    invoice_number: bill.invoice_number ?? '',
    invoice_date: bill.invoice_date ?? '',
    due_date: bill.due_date ?? '',
    total_amount: Number(bill.total_amount).toString(),
    taxable_amount: Number(bill.taxable_amount).toString(),
    gst_amount: Number(bill.gst_amount).toString(),
    cgst_amount: Number(bill.cgst_amount).toString(),
    sgst_amount: Number(bill.sgst_amount).toString(),
    igst_amount: Number(bill.igst_amount).toString(),
    tds_applicable: bill.tds_applicable,
    tds_rate: bill.tds_rate?.toString() ?? '',
    tds_amount: Number(bill.tds_amount).toString(),
    notes: bill.notes ?? '',
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: form.invoice_number || null,
          invoice_date: form.invoice_date || null,
          due_date: form.due_date || null,
          total_amount: parseFloat(form.total_amount) || 0,
          taxable_amount: parseFloat(form.taxable_amount) || 0,
          gst_amount: parseFloat(form.gst_amount) || 0,
          cgst_amount: parseFloat(form.cgst_amount) || 0,
          sgst_amount: parseFloat(form.sgst_amount) || 0,
          igst_amount: parseFloat(form.igst_amount) || 0,
          tds_applicable: form.tds_applicable,
          tds_rate: form.tds_rate ? parseFloat(form.tds_rate) : null,
          tds_amount: parseFloat(form.tds_amount) || 0,
          notes: form.notes || null,
        }),
      })

      const data = await res.json()
      if (!data.success) { setError(data.error ?? 'Failed to update bill'); return }
      onSuccess({ ...bill, ...data.data })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white z-10 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Bill</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
          <div className="font-medium text-blue-950">{bill.supplier.name}</div>
          <div className="text-blue-950 text-xs">Invoice: {bill.invoice_number ?? 'N/A'} · Current Total: {formatCurrency(Number(bill.total_amount))}</div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Invoice Number</label>
              <input className="input" type="text" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} placeholder="INV-001" />
            </div>
            <div>
              <label className="label">Invoice Date</label>
              <input className="input" type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Total Amount (₹)</label>
              <input className="input" type="number" step="0.01" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} required min="0" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tax Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Taxable Amount (₹)</label>
                <input className="input" type="number" step="0.01" value={form.taxable_amount} onChange={e => set('taxable_amount', e.target.value)} min="0" />
              </div>
              <div>
                <label className="label">Total GST (₹)</label>
                <input className="input" type="number" step="0.01" value={form.gst_amount} onChange={e => set('gst_amount', e.target.value)} min="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="label">CGST (₹)</label>
                <input className="input" type="number" step="0.01" value={form.cgst_amount} onChange={e => set('cgst_amount', e.target.value)} min="0" />
              </div>
              <div>
                <label className="label">SGST (₹)</label>
                <input className="input" type="number" step="0.01" value={form.sgst_amount} onChange={e => set('sgst_amount', e.target.value)} min="0" />
              </div>
              <div>
                <label className="label">IGST (₹)</label>
                <input className="input" type="number" step="0.01" value={form.igst_amount} onChange={e => set('igst_amount', e.target.value)} min="0" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">TDS Details</h3>

            <div className="flex items-center gap-3 mb-3">
              <input
                id="tds_applicable"
                type="checkbox"
                checked={form.tds_applicable}
                onChange={e => set('tds_applicable', e.target.checked)}
                className="w-4 h-4 rounded border border-gray-300"
              />
              <label htmlFor="tds_applicable" className="label mb-0">TDS Applicable</label>
            </div>

            {form.tds_applicable && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">TDS Rate (%)</label>
                  <input className="input" type="number" step="0.01" value={form.tds_rate} onChange={e => set('tds_rate', e.target.value)} min="0" max="100" />
                </div>
                <div>
                  <label className="label">TDS Amount (₹)</label>
                  <input className="input" type="number" step="0.01" value={form.tds_amount} onChange={e => set('tds_amount', e.target.value)} min="0" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
