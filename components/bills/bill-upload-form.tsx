'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Supplier, ExtractedBillData } from '@/types'
import { PAYMENT_MODES, formatCurrency } from '@/lib/utils'
import { Upload, Loader2, Sparkles, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react'

export default function BillUploadForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultSupplierId = searchParams.get('supplier') ?? ''
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedBillData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(suppliers)
  const [supplierStatus, setSupplierStatus] = useState<{ type: 'matched' | 'created'; name: string } | null>(null)

  const [form, setForm] = useState({
    supplier_id: defaultSupplierId,
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    total_amount: '',
    taxable_amount: '',
    cgst_amount: '',
    sgst_amount: '',
    igst_amount: '',
    gst_amount: '',
    tds_applicable: false,
    tds_rate: '',
    tds_amount: '',
    notes: '',
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setExtracted(null)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  async function handleScan() {
    if (!file) return
    setScanning(true)
    setError('')
    setSupplierStatus(null)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/scan-bill', { method: 'POST', body: fd })
      const data = await res.json()

      if (!data.success) { setError(data.error ?? 'Scan failed'); return }

      const ext: ExtractedBillData = data.data
      setExtracted(ext)

      // Auto-fill form fields
      setForm(f => ({
        ...f,
        invoice_number: ext.invoice_number ?? f.invoice_number,
        invoice_date: ext.invoice_date ?? f.invoice_date,
        due_date: ext.due_date ?? f.due_date,
        total_amount: ext.total_amount?.toString() ?? f.total_amount,
        taxable_amount: ext.taxable_amount?.toString() ?? f.taxable_amount,
        cgst_amount: ext.cgst_amount?.toString() ?? f.cgst_amount,
        sgst_amount: ext.sgst_amount?.toString() ?? f.sgst_amount,
        igst_amount: ext.igst_amount?.toString() ?? f.igst_amount,
        gst_amount: ext.gst_amount?.toString() ?? f.gst_amount,
        tds_applicable: ext.tds_applicable,
        tds_rate: ext.tds_rate?.toString() ?? f.tds_rate,
        tds_amount: ext.tds_amount?.toString() ?? f.tds_amount,
      }))

      // Auto-supplier: match existing or create new
      if (ext.supplier_name) {
        const extName = ext.supplier_name.toLowerCase()
        const matched = suppliersList.find(s =>
          s.name.toLowerCase() === extName ||
          s.name.toLowerCase().includes(extName) ||
          extName.includes(s.name.toLowerCase()) ||
          (ext.gst_number && s.gst_number === ext.gst_number)
        )

        if (matched) {
          setForm(prev => ({ ...prev, supplier_id: matched.id }))
          setSupplierStatus({ type: 'matched', name: matched.name })
        } else {
          // Auto-create the supplier from extracted data
          try {
            const createRes = await fetch('/api/suppliers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: ext.supplier_name,
                gst_number: ext.gst_number ?? null,
              }),
            })
            const createResult = await createRes.json()
            if (createResult.success) {
              const newSupplier: Supplier = createResult.data
              setSuppliersList(prev =>
                [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name))
              )
              setForm(prev => ({ ...prev, supplier_id: newSupplier.id }))
              setSupplierStatus({ type: 'created', name: newSupplier.name })
            }
          } catch {
            // Non-fatal — user can manually select supplier
          }
        }
      }
    } catch {
      setError('Scanning failed. Please fill in details manually.')
    } finally {
      setScanning(false)
    }
  }

  function normalizeDate(d: string): string | null {
    if (!d) return null
    const ddmmyyyy = d.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
    return d
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.supplier_id) { setError('Please select a supplier'); return }
    if (!form.total_amount) { setError('Total amount is required'); return }
    setSaving(true)
    setError('')

    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      fd.append('data', JSON.stringify({
        ...form,
        invoice_number: form.invoice_number || null,
        invoice_date: normalizeDate(form.invoice_date),
        due_date: normalizeDate(form.due_date),
        notes: form.notes || null,
        total_amount: parseFloat(form.total_amount) || 0,
        taxable_amount: parseFloat(form.taxable_amount) || 0,
        cgst_amount: parseFloat(form.cgst_amount) || 0,
        sgst_amount: parseFloat(form.sgst_amount) || 0,
        igst_amount: parseFloat(form.igst_amount) || 0,
        gst_amount: parseFloat(form.gst_amount) || 0,
        tds_rate: parseFloat(form.tds_rate) || null,
        tds_amount: parseFloat(form.tds_amount) || 0,
        raw_extracted_data: extracted,
      }))

      const res = await fetch('/api/bills', { method: 'POST', body: fd })
      const result = await res.json()

      if (!result.success) { setError(result.error ?? 'Failed to save bill'); return }
      router.push('/bills')
    } catch {
      setError('Failed to save bill. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload Bill</h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-700 hover:bg-blue-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="h-24 object-contain rounded" />
              ) : (
                <div className="text-4xl">📄</div>
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setExtracted(null) }}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Click to upload bill</p>
              <p className="text-sm text-gray-400">PDF, PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && !extracted && (
          <button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            className="btn-primary mt-4 w-full justify-center"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {scanning ? 'Scanning with AI...' : 'Scan with AI'}
          </button>
        )}

        {extracted && (
          <div className={`mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5 ${
            extracted.confidence === 'high' ? 'bg-green-50 text-green-800' :
            extracted.confidence === 'medium' ? 'bg-blue-50 text-blue-950' :
            'bg-red-50 text-red-800'
          }`}>
            {extracted.confidence === 'high' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <div className="text-sm">
              <strong>AI Extraction ({extracted.confidence} confidence)</strong>
              {extracted.supplier_name && <div>Supplier: {extracted.supplier_name}</div>}
              <div>Fields pre-filled below — please review and correct before saving.</div>
            </div>
          </div>
        )}
      </div>

      {/* Bill Details */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Bill Details</h2>

        <div>
          <label className="label">Supplier *</label>
          <select className="input" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} required>
            <option value="">Select supplier...</option>
            {suppliersList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {supplierStatus && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
              supplierStatus.type === 'created' ? 'text-blue-700' : 'text-green-700'
            }`}>
              {supplierStatus.type === 'created'
                ? <><UserPlus className="w-3.5 h-3.5" /> New supplier &quot;{supplierStatus.name}&quot; added automatically</>
                : <><CheckCircle className="w-3.5 h-3.5" /> Matched existing supplier &quot;{supplierStatus.name}&quot;</>
              }
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Invoice Number</label>
            <input className="input" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} placeholder="INV-2024-001" />
          </div>
          <div>
            <label className="label">Invoice Date</label>
            <input className="input" type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Due Date</label>
          <input className="input max-w-xs" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </div>

        {/* Amounts */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-700 mb-3">Amount Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Taxable Amount (₹)</label>
              <input className="input" type="number" step="0.01" value={form.taxable_amount} onChange={e => set('taxable_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">CGST (₹)</label>
              <input className="input" type="number" step="0.01" value={form.cgst_amount} onChange={e => set('cgst_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">SGST (₹)</label>
              <input className="input" type="number" step="0.01" value={form.sgst_amount} onChange={e => set('sgst_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">IGST (₹)</label>
              <input className="input" type="number" step="0.01" value={form.igst_amount} onChange={e => set('igst_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Total GST (₹)</label>
              <input className="input" type="number" step="0.01" value={form.gst_amount} onChange={e => set('gst_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label font-semibold text-gray-900">Total Amount (₹) *</label>
              <input className="input border-blue-700 font-semibold" type="number" step="0.01" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} placeholder="0.00" required />
            </div>
          </div>
        </div>

        {/* TDS */}
        <div className="border-t pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tds_applicable}
              onChange={e => set('tds_applicable', e.target.checked)}
              className="rounded text-blue-900"
            />
            <span className="label mb-0">TDS Applicable</span>
          </label>
          {form.tds_applicable && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="label">TDS Rate (%)</label>
                <input className="input" type="number" step="0.01" value={form.tds_rate} onChange={e => set('tds_rate', e.target.value)} placeholder="2.00" />
              </div>
              <div>
                <label className="label">TDS Amount (₹)</label>
                <input className="input" type="number" step="0.01" value={form.tds_amount} onChange={e => set('tds_amount', e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Bill
          </button>
        </div>
      </div>
    </form>
  )
}
