'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Supplier } from '@/types'
import { formatCurrency, SUPPLIER_CATEGORIES } from '@/lib/utils'
import { Plus, Search, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import SupplierForm from '@/components/suppliers/supplier-form'

interface SupplierWithBalance extends Supplier {
  outstanding_balance: number
}

export default function SuppliersClient({
  suppliers,
  isOwner,
}: {
  suppliers: SupplierWithBalance[]
  isOwner: boolean
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>()
  const [suppliersList, setSuppliersList] = useState<SupplierWithBalance[]>(suppliers)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const filtered = suppliersList.filter(s => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.gst_number?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !category || s.category === category
    return matchSearch && matchCategory
  })

  function handleAdd() {
    setEditSupplier(undefined)
    setShowForm(true)
  }

  function handleEdit(s: Supplier) {
    setEditSupplier(s)
    setShowForm(true)
  }

  async function handleDelete(supplier: SupplierWithBalance) {
    if (!confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return
    setDeletingId(supplier.id)
    setDeleteError('')
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        setDeleteError(data.error ?? 'Failed to delete supplier')
        return
      }
      setSuppliersList(prev => prev.filter(s => s.id !== supplier.id))
    } catch {
      setDeleteError('Something went wrong. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-500">{suppliersList.length} total suppliers</p>
          </div>
          {isOwner && (
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          )}
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{deleteError}</p>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or GST..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {SUPPLIER_CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{c.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {suppliersList.length === 0
                ? <span>No suppliers yet. <button onClick={handleAdd} className="text-blue-900 hover:underline">Add your first supplier</button>.</span>
                : 'No suppliers match your filters.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">GST Number</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Outstanding</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link href={`/suppliers/${s.id}`} className="font-medium text-gray-900 hover:text-blue-900 flex items-center gap-1">
                        {s.name}
                        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                      </Link>
                      {s.email && <span className="text-xs text-gray-400">{s.email}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.gst_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{s.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${s.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(s.outstanding_balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isOwner && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="text-xs text-gray-500 hover:text-blue-900 font-medium px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            disabled={deletingId === s.id}
                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete supplier"
                          >
                            {deletingId === s.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editSupplier}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); window.location.reload() }}
        />
      )}
    </>
  )
}
