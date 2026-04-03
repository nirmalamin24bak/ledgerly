import { createClient } from '@/lib/supabase/server'

type SupabaseClient = ReturnType<typeof createClient>

export async function verifyProjectOwnership(
  supabase: SupabaseClient,
  projectId: string | null,
  userId: string
): Promise<boolean> {
  if (!projectId) return true
  const { data } = await supabase
    .from('ledger_projects')
    .select('id')
    .eq('id', projectId)
    .eq('owner_id', userId)
    .single()
  return !!data
}
