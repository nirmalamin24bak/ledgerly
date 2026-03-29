import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_type } = await req.json()
  if (!['individual', 'company'].includes(account_type)) {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ account_type })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
