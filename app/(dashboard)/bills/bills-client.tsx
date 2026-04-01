'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BillWithSupplier, Supplier, BillStatus } from '@/types'
import { formatCurrency, formatDate, statusColor, isOverdue, SUPPLIER_CATEGORIES } from '@/lib/utils'
import { Upload, Search, ExternalLink, AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import PaymentForm from '@/components/payments/payment-form'

interface Props {
  bills: BillWithSupplier[]
  suppliers: Pick<Supplier, 'id' | 'name' | 'category'>[]
  isOwner?: boolean
}

export default function BillsClient({ bills, suppliers, isOwner = true }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BillStatus | ''>('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payBill, setPayBill] = useState<BillWithSupplier | null>(null)
  const [billsList, setBillsList] = useState<BillWithSupplier[]>(bills)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const filtered = billsList.filter(b => {
    const matchSearch = !search ||
      b.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier.gst_number?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || b.status === statusFilter
    const matchSupplier = !supplierFilter || b.supplier_id === supplierFilter
    const matchFrom = !dateFrom || (b.invoice_date ?? '') >= dateFrom
    const matchTo = !dateTo || (b.invoice_date ?? '') <= dateTo
    return matchSearch && matchStatus && matchSupplier && matchFrom && matchTo
  })

  const totals = filtered.reduce(
    (acc, b) => ({
      amount: acc.amount + Number(b.total_amount),
      gst: acc.gst + Number(b.gst_amount),
      tds: acc.tds + Number(b.tds_amount),
    }),
    { amount: 0, gst: 0, tds: 0 }
  )

  async function handleDelete(bill: BillWithSupplier) {
    if (!confirm(`Delete bill "${bill.invoice_number ?? bill.id.substring(0, 8)}" from ${bill.supplier.name}? This cannot be undone.`)) return
    setDeletingId(bill.id)
    setDeleteError('')
    try {
      const res = await fetch(`/api/bills/${bill.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        setDeleteError(data.error ?? 'Failed to delete bill')
        return
      }
      setBillsList(prev => prev.filter(b => b.id !== bill.id))
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
            <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
            <p className="text-sm text-gray-500">{billsList.length} total bills</p>
          </div>
          <Link href="/bills/upload" className="btn-primary">
            <Upload className="w-4 h-4" /> Upload Bill
          </Link>
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{deleteError}</p>
        )}

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search invoice, supplier, GST..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as BillStatus | '')}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <select className="input w-auto" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
              <option value="">All suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className="input w-36" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
            <input className="input w-36" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
          </div>
        </div>

        {/* Summary bar */}
        {filtered.length > 0 && (
          <div className="flex gap-6 text-sm px-1">
            <span className="text-gray-500">{filtered.length} bills</span>
            <span className="text-gray-900 font-medium">Total: <strong>{formatCurrency(totals.amount)}</strong></span>
            <span className="text-gray-500">GST: {formatCurrency(totals.gst)}</span>
            {totals.tds > 0 && <span className="text-gray-500">TDS: {formatCurrency(totals.tds)}</span>}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {billsList.length === 0
                ? <span>No bills yet. <Link href="/bills/upload" className="text-blue-900 hover:underline">Upload your first bill</Link>.</span>
                : 'No bills match your filters.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Due</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">GST</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link href={`/suppliers/${b.supplier_id}`} className="font-medium text-gray-900 hover:text-blue-900">
                        {b.supplier.name}
                      </Link>
                      {b.supplier.category && <div className="text-xs text-gray-400 capitalize">{b.supplier.category}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.invoice_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.invoice_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs ${isOverdue(b.due_date) && b.status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {isOverdue(b.due_date) && b.status !== 'paid' && <AlertTriangle className="w-3 h-3" />}
                        {formatDate(b.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(Number(b.total_amount))}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(b.gst_amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColor(b.status)} capitalize`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.file_url && (
                          <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-900" title="View file">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {b.status !== 'paid' && (
                          <button
                            onClick={() => setPayBill(b)}
                            className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded font-medium"
                          >
                            Pay
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(b)}
                            disabled={deletingId === b.id}
                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete bill"
                          >
                            {deletingId === b.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {payBill && (
        <PaymentForm
          bill={payBill}
          supplier={payBill.supplier}
          onClose={() => setPayBill(null)}
          onSuccess={() => { setPayBill(null); window.location.reload() }}
        />
      )}
    </>
  )
}
