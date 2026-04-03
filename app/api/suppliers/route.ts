import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const SupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  gst_number: z.string().regex(/^[0-9A-Z]{15}$/).nullable().optional()
    .or(z.literal('').transform(() => null)),
  category: z.enum(['steel','rmc','labour','cement','sand','electrical','plumbing','tiles','glass','hardware','paint','other']).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(200).nullable().optional()
    .or(z.literal('').transform(() => null)),
  address: z.string().max(500).nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() }
    catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = SupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const projectId = cookies().get('ledgerly_project_id')?.value ?? null

    if (projectId) {
      const { data: project } = await supabase
        .from('ledger_projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .single()
      if (!project) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({ ...parsed.data, owner_id: user.id, ...(projectId ? { project_id: projectId } : {}) })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'A supplier with this GST number already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('POST /api/suppliers:', error)
    return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = 100 // suppliers list is smaller, 100 per page
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    const { data, error, count } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .in('owner_id', ownerIds)
      .order('name', { ascending: true })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}
