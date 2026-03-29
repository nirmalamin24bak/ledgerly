import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET — list accountants for the current owner
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('accountant_access')
    .select('id, accountant_id, created_at')
    .eq('owner_id', user.id)

  if (!data?.length) return NextResponse.json({ accountants: [] })

  // Fetch names/emails from user_profiles
  const ids = data.map(r => r.accountant_id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, name, email')
    .in('id', ids)

  const accountants = data.map(r => {
    const p = profiles?.find(p => p.id === r.accountant_id)
    return {
      accessId: r.id,
      userId: r.accountant_id,
      name: p?.name ?? 'Unknown',
      email: p?.email ?? '—',
      addedAt: r.created_at,
    }
  })

  return NextResponse.json({ accountants })
}

// POST — invite accountant by email
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only company accounts can invite accountants
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (profile?.account_type !== 'company') {
    return NextResponse.json({ error: 'Only company accounts can add team members' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Look up the user by email in user_profiles (service role for broader access)
  const service = createServiceClient()
  const { data: target } = await service
    .from('user_profiles')
    .select('id, name')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!target) {
    return NextResponse.json({ error: 'No Ledgerly account found with that email' }, { status: 404 })
  }

  if (target.id === user.id) {
    return NextResponse.json({ error: 'You cannot add yourself as an accountant' }, { status: 400 })
  }

  // Check not already added
  const { data: existing } = await supabase
    .from('accountant_access')
    .select('id')
    .eq('owner_id', user.id)
    .eq('accountant_id', target.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `${target.name} already has access` }, { status: 409 })
  }

  const { error } = await supabase
    .from('accountant_access')
    .insert({ owner_id: user.id, accountant_id: target.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, name: target.name })
}

// DELETE — remove accountant access
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accessId } = await req.json()
  if (!accessId) return NextResponse.json({ error: 'accessId required' }, { status: 400 })

  const { error } = await supabase
    .from('accountant_access')
    .delete()
    .eq('id', accessId)
    .eq('owner_id', user.id) // safety: only owner can remove

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
