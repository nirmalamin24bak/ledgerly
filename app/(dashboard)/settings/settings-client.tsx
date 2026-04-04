'use client'

import { useState, useEffect } from 'react'
import { User, Briefcase, Loader2, Check, Zap, Building2, Shield, Users, X, Plus } from 'lucide-react'
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

type Accountant = { id: string; accountant_id: string; name: string; email: string }

function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  return { saving, setSaving, saved, setSaved, error, setError }
}

export default function SettingsClient({
  name: initialName,
  phone: initialPhone,
  email,
  companyName: initialCompanyName,
  gstin: initialGstin,
  panNumber: initialPanNumber,
  address: initialAddress,
  role,
  accountType: initial,
  plan,
  scanCount,
  scanLimit,
}: {
  name: string
  phone: string
  email: string
  companyName: string
  gstin: string
  panNumber: string
  address: string
  role: 'owner' | 'accountant'
  accountType: 'individual' | 'company'
  plan: Plan
  scanCount: number
  scanLimit: number | null
}) {
  const router = useRouter()

  // Profile card
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const profile = useSaveState()

  // Business card
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [gstin, setGstin] = useState(initialGstin)
  const [panNumber, setPanNumber] = useState(initialPanNumber)
  const [address, setAddress] = useState(initialAddress)
  const business = useSaveState()

  // Account type card
  const [accountType, setAccountType] = useState(initial)
  const accountTypeState = useSaveState()

  // Security card
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const security = useSaveState()

  // Team access card
  const [accountants, setAccountants] = useState<Accountant[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingAccountants, setLoadingAccountants] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const usagePct = scanLimit !== null ? Math.min(100, (scanCount / scanLimit) * 100) : 0
  const isNearLimit = scanLimit !== null && scanCount / scanLimit > 0.8

  useEffect(() => {
    if (initial === 'company' && role === 'owner') {
      fetchAccountants()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAccountants() {
    setLoadingAccountants(true)
    try {
      const res = await fetch('/api/settings/accountants')
      if (res.ok) setAccountants(await res.json())
    } finally {
      setLoadingAccountants(false)
    }
  }

  async function handleSaveProfile() {
    profile.setSaving(true)
    profile.setError('')
    profile.setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) { profile.setError(data.error); return }
      profile.setSaved(true)
      router.refresh()
    } catch {
      profile.setError('Something went wrong.')
    } finally {
      profile.setSaving(false)
    }
  }

  async function handleSaveBusiness() {
    business.setSaving(true)
    business.setError('')
    business.setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          gstin: gstin || null,
          pan_number: panNumber || null,
          address,
        }),
      })
      const data = await res.json()
      if (!res.ok) { business.setError(data.error); return }
      business.setSaved(true)
    } catch {
      business.setError('Something went wrong.')
    } finally {
      business.setSaving(false)
    }
  }

  async function handleSaveAccountType() {
    if (accountType === initial) return
    accountTypeState.setSaving(true)
    accountTypeState.setError('')
    accountTypeState.setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType }),
      })
      const data = await res.json()
      if (!res.ok) { accountTypeState.setError(data.error); return }
      accountTypeState.setSaved(true)
      router.refresh()
    } catch {
      accountTypeState.setError('Something went wrong.')
    } finally {
      accountTypeState.setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      security.setError('Passwords do not match.')
      return
    }
    security.setSaving(true)
    security.setError('')
    security.setSaved(false)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { security.setError(data.error); return }
      security.setSaved(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      security.setError('Something went wrong.')
    } finally {
      security.setSaving(false)
    }
  }

  async function handleInvite() {
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/settings/accountants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error); return }
      setInviteEmail('')
      await fetchAccountants()
    } catch {
      setInviteError('Something went wrong.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(accountantId: string) {
    setRemovingId(accountantId)
    try {
      const res = await fetch('/api/settings/accountants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountant_id: accountantId }),
      })
      if (res.ok) {
        setAccountants(prev => prev.filter(a => a.accountant_id !== accountantId))
      }
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-5">

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><User className="w-4 h-4" /> Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={e => { setName(e.target.value); profile.setSaved(false) }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={phone}
              onChange={e => { setPhone(e.target.value); profile.setSaved(false) }}
              placeholder="+91 98765 43210"
              type="tel"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Email</label>
            <p className="input bg-gray-50 text-gray-500 cursor-default truncate">{email || '—'}</p>
          </div>
        </div>
        {profile.error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{profile.error}</p>}
        <button
          onClick={handleSaveProfile}
          disabled={profile.saving}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {profile.saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {profile.saved && <Check className="w-4 h-4" />}
          {profile.saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>

      {/* Business Details — company accounts only */}
      {accountType === 'company' && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title flex items-center gap-2"><Building2 className="w-4 h-4" /> Business Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company Name</label>
              <input
                className="input"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); business.setSaved(false) }}
                placeholder="Acme Construction Pvt Ltd"
              />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input
                className="input font-mono uppercase"
                value={gstin}
                onChange={e => { setGstin(e.target.value.toUpperCase()); business.setSaved(false) }}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input
                className="input font-mono uppercase"
                value={panNumber}
                onChange={e => { setPanNumber(e.target.value.toUpperCase()); business.setSaved(false) }}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Business Address</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={address}
                onChange={e => { setAddress(e.target.value); business.setSaved(false) }}
                placeholder="123 MG Road, Bangalore, Karnataka 560001"
              />
            </div>
          </div>
          {business.error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{business.error}</p>}
          <button
            onClick={handleSaveBusiness}
            disabled={business.saving}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {business.saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {business.saved && <Check className="w-4 h-4" />}
            {business.saved ? 'Saved!' : 'Save business details'}
          </button>
        </div>
      )}

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
            onClick={() => { setAccountType('individual'); accountTypeState.setSaved(false) }}
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
            onClick={() => { setAccountType('company'); accountTypeState.setSaved(false) }}
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

        {accountTypeState.error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{accountTypeState.error}</p>}

        <button
          onClick={handleSaveAccountType}
          disabled={accountTypeState.saving || accountType === initial}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {accountTypeState.saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {accountTypeState.saved && <Check className="w-4 h-4" />}
          {accountTypeState.saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Team Access — company owners only */}
      {accountType === 'company' && role === 'owner' && (
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="section-title flex items-center gap-2"><Users className="w-4 h-4" /> Team Access</h2>
            <p className="text-sm text-gray-400 mt-0.5">Grant accountants read access to your bills and ledger.</p>
          </div>

          {loadingAccountants ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : accountants.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {accountants.map(a => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(a.accountant_id)}
                    disabled={removingId === a.accountant_id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Remove access"
                  >
                    {removingId === a.accountant_id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <X className="w-4 h-4" />
                    }
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No accountants have access yet.</p>
          )}

          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError('') }}
              placeholder="accountant@firm.com"
              onKeyDown={e => { if (e.key === 'Enter' && inviteEmail) handleInvite() }}
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
          {inviteError && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{inviteError}</p>}
        </div>
      )}

      {/* Security */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><Shield className="w-4 h-4" /> Security</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); security.setSaved(false); security.setError('') }}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); security.setSaved(false); security.setError('') }}
              placeholder="Re-enter password"
            />
          </div>
        </div>
        {security.error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{security.error}</p>}
        <button
          onClick={handleChangePassword}
          disabled={security.saving || !newPassword || !confirmPassword}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {security.saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {security.saved && <Check className="w-4 h-4" />}
          {security.saved ? 'Password updated!' : 'Change password'}
        </button>
      </div>

    </div>
  )
}
