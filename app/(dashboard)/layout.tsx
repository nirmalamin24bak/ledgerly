import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email ?? 'User'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userName={displayName} />
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
