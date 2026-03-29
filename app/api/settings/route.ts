import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_type } = await req.json()
  if (!['individual', 'company'].includes(account_type)) {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
  }

  // Update via auth admin — goes through /auth/v1/, not PostgREST, so no schema cache issues
  const service = createServiceClient()
  const { error } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, account_type },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
