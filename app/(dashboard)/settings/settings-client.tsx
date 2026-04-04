'use client'

import { useState } from 'react'
import { User, Briefcase, Loader2, Check, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Plan } from '@/lib/scan/usage'

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
}

export default function SettingsClient({
  name,
  email,
  accountType: initial,
  plan,
  scanCount,
  scanLimit,
}: {
  name: string
  email: string
  accountType: 'individual' | 'company'
  plan: Plan
  scanCount: number
  scanLimit: number | null // null = unlimited (Enterprise)
}) {
  const [accountType, setAccountType] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    if (accountType === initial) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const usagePct = scanLimit !== null ? Math.min(100, (scanCount / scanLimit) * 100) : 0
  const isNearLimit = scanLimit !== null && scanCount / scanLimit > 0.8

  return (
    <div className="space-y-5">
      {/* Profile info (read-only) */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <p className="input bg-gray-50 text-gray-600 cursor-default">{name || '—'}</p>
          </div>
          <div>
            <label className="label">Email</label>
            <p className="input bg-gray-50 text-gray-600 cursor-default truncate">{email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Scan Usage */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Scan Usage</h2>
            <p className="text-sm text-gray-400 mt-0.5">Bill scans used this month.</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${PLAN_COLORS[plan]}`}>
            {PLAN_LABELS[plan]}
          </span>
        </div>

        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-bold text-gray-900">{scanCount}</span>
          <span className="text-sm text-gray-400 mb-0.5">
            / {scanLimit === null ? '∞' : scanLimit} scans
          </span>
        </div>

        {scanLimit !== null && (
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}

        {plan === 'free' && (
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <span className="font-semibold">Upgrade to Pro</span> for 200 scans/month and
              faster digital PDF processing — ideal for regular billing.
            </div>
          </div>
        )}

        {plan === 'pro' && (
          <div className="flex items-start gap-2.5 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
            <Zap className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <div className="text-sm text-purple-900">
              <span className="font-semibold">Upgrade to Enterprise</span> for unlimited scans,
              high-accuracy fallback on complex documents, and priority support.
            </div>
          </div>
        )}
      </div>

      {/* Account type */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="section-title">Account type</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Company accounts get supplier management, payments tracking, and team access for accountants.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setAccountType('individual'); setSaved(false) }}
            className={`flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
              accountType === 'individual'
                ? 'border-blue-900 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className={`w-5 h-5 mt-0.5 shrink-0 ${accountType === 'individual' ? 'text-blue-900' : 'text-gray-400'}`} />
            <div>
              <div className={`font-semibold text-sm ${accountType === 'individual' ? 'text-blue-900' : 'text-gray-700'}`}>Individual</div>
              <div className="text-xs text-gray-400 mt-0.5">Personal receipt & expense tracking</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setAccountType('company'); setSaved(false) }}
            className={`flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
              accountType === 'company'
                ? 'border-blue-900 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Briefcase className={`w-5 h-5 mt-0.5 shrink-0 ${accountType === 'company' ? 'text-blue-900' : 'text-gray-400'}`} />
            <div>
              <div className={`font-semibold text-sm ${accountType === 'company' ? 'text-blue-900' : 'text-gray-700'}`}>Company</div>
              <div className="text-xs text-gray-400 mt-0.5">Full features + accountant team access</div>
            </div>
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || accountType === initial}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved && <Check className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
