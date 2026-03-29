import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, role, account_type')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email ?? 'User'
  const accountType = (profile?.account_type ?? 'individual') as 'individual' | 'company'

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar userName={displayName} accountType={accountType} />
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="px-8 py-7 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
