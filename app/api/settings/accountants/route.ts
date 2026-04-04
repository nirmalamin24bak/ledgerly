import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all accountant_access rows for this owner
  const { data: rows, error } = await supabase
    .from('accountant_access')
    .select('id, accountant_id')
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) return NextResponse.json([])

  // Fetch names from user_profiles and emails from auth admin
  const service = createServiceClient()
  const accountants = await Promise.all(
    rows.map(async (row) => {
      const [profileRes, authRes] = await Promise.all([
        supabase.from('user_profiles').select('name').eq('id', row.accountant_id).single(),
        service.auth.admin.getUserById(row.accountant_id),
      ])
      return {
        id: row.id,
        accountant_id: row.accountant_id,
        name: profileRes.data?.name ?? 'Unknown',
        email: authRes.data?.user?.email ?? '',
      }
    })
  )

  return NextResponse.json(accountants)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = z.object({ email: z.string().email() }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Look up user by email
  const { data: authData, error: authError } = await service.auth.admin.listUsers()
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const accountantUser = authData.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
  )
  if (!accountantUser) {
    return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
  }
  if (accountantUser.id === user.id) {
    return NextResponse.json({ error: 'You cannot add yourself as an accountant' }, { status: 400 })
  }

  const { error } = await supabase
    .from('accountant_access')
    .insert({ owner_id: user.id, accountant_id: accountantUser.id })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This accountant already has access' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = z.object({ accountant_id: z.string().uuid() }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid accountant_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('accountant_access')
    .delete()
    .eq('owner_id', user.id)
    .eq('accountant_id', parsed.data.accountant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
