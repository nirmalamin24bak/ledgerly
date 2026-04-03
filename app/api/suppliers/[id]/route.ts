import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  gst_number: z.string().regex(/^[0-9A-Z]{15}$/).nullable().optional()
    .or(z.literal('').transform(() => null)),
  category: z.enum(['steel','rmc','labour','cement','sand','electrical','plumbing','tiles','glass','hardware','paint','other']).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(200).nullable().optional()
    .or(z.literal('').transform(() => null)),
  address: z.string().max(500).nullable().optional(),
})

function isValidUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid supplier ID' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() }
    catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PUT /api/suppliers/[id]:', error)
    return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid supplier ID' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Verify ownership before checking counts (prevents cross-tenant data exposure)
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    }

    const [{ count: billCount }, { count: paymentCount }] = await Promise.all([
      supabase.from('bills').select('*', { count: 'exact', head: true })
        .eq('supplier_id', params.id).eq('owner_id', user.id),
      supabase.from('payments').select('*', { count: 'exact', head: true })
        .eq('supplier_id', params.id).eq('owner_id', user.id),
    ])

    if ((billCount ?? 0) > 0 || (paymentCount ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete supplier with existing bills or payments' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete supplier' }, { status: 500 })
  }
}
