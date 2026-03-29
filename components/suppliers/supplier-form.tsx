'use client'

import { useState } from 'react'
import { Supplier, SupplierCategory } from '@/types'
import { SUPPLIER_CATEGORIES } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'

interface Props {
  supplier?: Supplier
  onClose: () => void
  onSuccess: () => void
}

export default function SupplierForm({ supplier, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    gst_number: supplier?.gst_number ?? '',
    category: supplier?.category ?? '',
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const method = supplier ? 'PUT' : 'POST'
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category: form.category || null,
          gst_number: form.gst_number || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
        }),
      })

      const data = await res.json()
      if (!data.success) { setError(data.error ?? 'Failed to save'); return }
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {supplier ? 'Edit Supplier' : 'Add Supplier'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Supplier Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="ABC Steel Suppliers" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GST Number</label>
              <input className="input" value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="22AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {SUPPLIER_CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="supplier@company.com" />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City, State" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {supplier ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
