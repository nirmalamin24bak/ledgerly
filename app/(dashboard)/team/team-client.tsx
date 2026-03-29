'use client'

import { useState } from 'react'
import { Loader2, Trash2, UserPlus, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Accountant {
  accessId: string
  userId: string
  name: string
  email: string
  addedAt: string
}

export default function TeamClient({ initial }: { initial: Accountant[] }) {
  const [accountants, setAccountants] = useState<Accountant[]>(initial)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(`${data.name} now has access to your data.`)
      setEmail('')
      // Refresh list
      const listRes = await fetch('/api/team')
      const listData = await listRes.json()
      setAccountants(listData.accountants ?? [])
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(accessId: string, name: string) {
    if (!confirm(`Remove ${name}'s access?`)) return
    setRemoving(accessId)
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId }),
      })
      if (res.ok) {
        setAccountants(prev => prev.filter(a => a.accessId !== accessId))
      }
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="card p-6">
        <h2 className="section-title mb-1">Add accountant</h2>
        <p className="text-sm text-gray-400 mb-4">
          Enter the email address of the Ledgerly account you want to grant read access to your data.
        </p>
        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              className="input pl-9"
              placeholder="accountant@firm.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Grant access
          </button>
        </form>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 mt-3">{success}</p>}
      </div>

      {/* Current team */}
      <div>
        <h2 className="section-title mb-3">Current access ({accountants.length})</h2>
        {accountants.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 text-sm">
            No accountants yet. Add one above to share access.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Access granted</th>
                  <th className="table-th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {accountants.map(a => (
                  <tr key={a.accessId} className="table-row-hover">
                    <td className="table-td font-medium text-gray-900">{a.name}</td>
                    <td className="table-td text-gray-500">{a.email}</td>
                    <td className="table-td text-gray-400">{formatDate(a.addedAt)}</td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => handleRemove(a.accessId, a.name)}
                        disabled={removing === a.accessId}
                        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                      >
                        {removing === a.accessId
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
