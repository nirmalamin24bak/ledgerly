import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  gst_number: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('owner_id', user.id) // Only owner can update
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PUT /api/suppliers/[id]:', error)
    return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Check for bills or payments
    const [{ count: billCount }, { count: paymentCount }] = await Promise.all([
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('supplier_id', params.id),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('supplier_id', params.id),
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
