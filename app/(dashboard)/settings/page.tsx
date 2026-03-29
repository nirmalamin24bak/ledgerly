import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, email, account_type')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account preferences.</p>
      </div>

      <SettingsClient
        name={profile?.name ?? ''}
        email={profile?.email ?? user.email ?? ''}
        accountType={(profile?.account_type ?? 'individual') as 'individual' | 'company'}
      />
    </div>
  )
}
