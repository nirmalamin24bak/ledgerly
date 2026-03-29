'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Sparkles, Loader2, Send } from 'lucide-react'

interface MonthlySummary {
  month: string
  bills: number
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total_gst: number
  tds: number
  total: number
}

interface CategoryOutstanding {
  category: string
  amount: number
}

interface Props {
  monthlySummary: MonthlySummary[]
  categoryOutstanding: CategoryOutstanding[]
  year: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ReportsClient({ monthlySummary, categoryOutstanding, year }: Props) {
  const [query, setQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ explanation: string; rows: Record<string, unknown>[] } | null>(null)
  const [aiError, setAiError] = useState('')

  const EXAMPLE_QUERIES = [
    'How much do I owe total?',
    'Show overdue bills',
    'Total outstanding this month',
    'Which supplier has the highest outstanding?',
  ]

  async function handleAiQuery(q?: string) {
    const queryText = q ?? query
    if (!queryText.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)

    try {
      const res = await fetch('/api/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      })
      const data = await res.json()
      if (!data.success) { setAiError(data.error ?? 'Query failed'); return }
      setAiResult(data.data)
    } catch {
      setAiError('AI query failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const yearlyTotals = monthlySummary.reduce(
    (acc, m) => ({ taxable: acc.taxable + m.taxable, cgst: acc.cgst + m.cgst, sgst: acc.sgst + m.sgst, igst: acc.igst + m.igst, total_gst: acc.total_gst + m.total_gst, tds: acc.tds + m.tds, total: acc.total + m.total }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total_gst: 0, tds: 0, total: 0 }
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Financial year {year} summary</p>
      </div>

      {/* AI Query */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-900">Ask AI</h2>
          <span className="badge bg-amber-100 text-amber-700 ml-1">Beta</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">Ask questions about your bills and payments in plain English.</p>

        <div className="flex gap-3 mb-3">
          <input
            className="input flex-1"
            placeholder="e.g. How much do I owe ABC Steel?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiQuery()}
          />
          <button
            onClick={() => handleAiQuery()}
            disabled={aiLoading || !query.trim()}
            className="btn-primary px-3"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); handleAiQuery(q) }}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {aiError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{aiError}</div>
        )}

        {aiResult && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600 bg-amber-50 rounded-lg px-4 py-2.5 italic">{aiResult.explanation}</p>
            {aiResult.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(aiResult.rows[0]).map(k => (
                        <th key={k} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{k.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {aiResult.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-800">
                            {typeof val === 'number' ? formatCurrency(val) : String(val ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No results found.</p>
            )}
          </div>
        )}
      </div>

      {/* Monthly GST Summary */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Monthly GST Summary — {year}</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Bills</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Taxable</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">CGST</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">SGST</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">IGST</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total GST</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">TDS</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Bill Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlySummary.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No data for {year}.</td></tr>
              ) : monthlySummary.map(m => {
                const [, monthNum] = m.month.split('-')
                const label = MONTH_LABELS[parseInt(monthNum) - 1]
                return (
                  <tr key={m.month} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-gray-900">{label} {year}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{m.bills}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(m.taxable)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(m.cgst)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(m.sgst)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(m.igst)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(m.total_gst)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(m.tds)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(m.total)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50 border-t-2 border-amber-200">
                <td className="px-4 py-3 font-bold text-gray-900">Total {year}</td>
                <td className="px-4 py-3 text-right font-semibold">{monthlySummary.reduce((s, m) => s + m.bills, 0)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(yearlyTotals.taxable)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(yearlyTotals.cgst)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(yearlyTotals.sgst)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(yearlyTotals.igst)}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(yearlyTotals.total_gst)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(yearlyTotals.tds)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(yearlyTotals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Category-wise Outstanding */}
      {categoryOutstanding.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Outstanding by Category</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryOutstanding.map(c => (
                  <tr key={c.category} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{c.category}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
