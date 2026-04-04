import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { recalculateSupplierLedger } from '@/lib/ledger'
import { z } from 'zod'

const UpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'partial']).optional(),
  notes: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
      .from('bills')
      .update(parsed.data)
      .eq('id', params.id)
      .in('owner_id', [user.id]) // Only owner can update
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update bill' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Fetch bill to get supplier_id and file_path before deletion
    // Only filter by id — RLS (accessible_owner_ids) handles read access
    const { data: bill, error: fetchError } = await supabase
      .from('bills')
      .select('id, supplier_id, file_path, owner_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !bill) {
      console.error('bill fetch error:', fetchError?.message, 'bill_id:', params.id, 'user_id:', user.id)
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 })
    }

    // Only the bill owner can delete (accountants can view but not delete)
    if (bill.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Only the account owner can delete bills' }, { status: 403 })
    }

    // Delete ledger entry for this bill
    await supabase
      .from('ledger_entries')
      .delete()
      .eq('reference_type', 'bill')
      .eq('reference_id', params.id)
      .eq('owner_id', user.id)

    // Delete the bill
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (error) throw error

    // Recalculate running balances for the supplier (non-fatal)
    try {
      await recalculateSupplierLedger(bill.supplier_id, user.id)
    } catch (e) {
      console.error('Balance recalculation failed after bill delete:', e)
    }

    // Delete file from storage (non-fatal)
    if (bill.file_path) {
      const serviceClient = createServiceClient()
      await serviceClient.storage.from('bills').remove([bill.file_path])
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete bill' }, { status: 500 })
  }
}
