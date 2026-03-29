import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import TeamClient from './team-client'

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read account_type from auth metadata (same as layout.tsx)
  const accountType = user.user_metadata?.account_type ?? 'individual'
  if (accountType !== 'company') redirect('/dashboard')

  // Fetch current accountants
  const { data: accessRows } = await supabase
    .from('accountant_access')
    .select('id, accountant_id, created_at')
    .eq('owner_id', user.id)

  const accountantIds = accessRows?.map(r => r.accountant_id) ?? []
  const profiles = accountantIds.length
    ? (await supabase.from('user_profiles').select('id, name, email').in('id', accountantIds)).data ?? []
    : []

  const accountants = (accessRows ?? []).map(r => {
    const p = profiles.find(p => p.id === r.accountant_id)
    return {
      accessId: r.id,
      userId: r.accountant_id,
      name: p?.name ?? 'Unknown',
      email: p?.email ?? '—',
      addedAt: r.created_at,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Team Access</h1>
        <p className="text-sm text-gray-400 mt-1">
          Grant accountants read access to your bills, payments, and ledger.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
        <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">Read-only access.</span>{' '}
          Accountants can view all your suppliers, bills, payments, and reports — but cannot create, edit, or delete anything.
          They must already have a Ledgerly account.
        </div>
      </div>

      <TeamClient initial={accountants} />
    </div>
  )
}
