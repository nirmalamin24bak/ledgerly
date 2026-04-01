import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'
import { LedgerProject } from '@/types'

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
  const accountType = (user.user_metadata?.account_type ?? 'individual') as 'individual' | 'company'

  let projects: LedgerProject[] = []
  let activeProjectId: string | undefined

  if (accountType === 'company') {
    const { data: projectsData } = await supabase
      .from('ledger_projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })

    projects = projectsData ?? []

    // Auto-create Default Project if user has no projects yet
    if (projects.length === 0) {
      const { data: newProject } = await supabase
        .from('ledger_projects')
        .insert({ owner_id: user.id, name: 'Default Project' })
        .select()
        .single()
      if (newProject) projects = [newProject]
    }

    const cookieStore = cookies()
    const cookieProjectId = cookieStore.get('ledgerly_project_id')?.value

    // Use cookie project if it still exists; otherwise fall back to first project
    if (cookieProjectId && projects.find(p => p.id === cookieProjectId)) {
      activeProjectId = cookieProjectId
    } else if (projects.length > 0) {
      activeProjectId = projects[0].id
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar
        userName={displayName}
        accountType={accountType}
        projects={projects}
        activeProjectId={activeProjectId}
      />
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="px-8 py-7 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
