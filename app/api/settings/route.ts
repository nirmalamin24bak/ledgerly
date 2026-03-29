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

  // Use RPC to bypass PostgREST schema cache issue with new columns
  const { error } = await supabase.rpc('update_account_type', { new_type: account_type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
