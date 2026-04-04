import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'
import { getScanCount, getCurrentYearMonth, PLAN_LIMITS, Plan } from '@/lib/scan/usage'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = (user.user_metadata?.plan ?? 'free') as Plan
  const yearMonth = getCurrentYearMonth()

  const [profileResult, scanCount] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('name, phone, company_name, gstin, pan_number, address, role')
      .eq('id', user.id)
      .single(),
    getScanCount(user.id, yearMonth),
  ])

  const profile = profileResult.data
  const scanLimit = plan === 'enterprise' ? null : PLAN_LIMITS[plan]

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account preferences.</p>
      </div>

      <SettingsClient
        name={profile?.name ?? ''}
        phone={profile?.phone ?? ''}
        email={user.email ?? ''}
        companyName={profile?.company_name ?? ''}
        gstin={profile?.gstin ?? ''}
        panNumber={profile?.pan_number ?? ''}
        address={profile?.address ?? ''}
        role={(profile?.role ?? 'owner') as 'owner' | 'accountant'}
        accountType={(user.user_metadata?.account_type ?? 'individual') as 'individual' | 'company'}
        plan={plan}
        scanCount={scanCount}
        scanLimit={scanLimit}
      />
    </div>
  )
}
