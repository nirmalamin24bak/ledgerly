import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { recalculateSupplierLedger } from '@/lib/ledger'
import { z } from 'zod'

const UpdateSchema = z.object({
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z.number().positive().optional(),
  taxable_amount: z.number().optional(),
  gst_amount: z.number().optional(),
  cgst_amount: z.number().optional(),
  sgst_amount: z.number().optional(),
  igst_amount: z.number().optional(),
  tds_applicable: z.boolean().optional(),
  tds_rate: z.number().nullable().optional(),
  tds_amount: z.number().optional(),
  status: z.enum(['pending', 'paid', 'partial']).optional(),
  notes: z.string().nullable().optional(),
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

    // Fetch current bill to get supplier_id (needed for ledger recalc)
    const { data: currentBill } = await supabase
      .from('bills')
      .select('supplier_id')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    const { data, error } = await supabase
      .from('bills')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Recalculate supplier ledger if amount fields changed (non-fatal if fails)
    const amountFieldsChanged = Object.keys(parsed.data).some(k =>
      ['total_amount', 'taxable_amount', 'gst_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 'tds_amount'].includes(k)
    )
    if (amountFieldsChanged && currentBill?.supplier_id) {
      try {
        await recalculateSupplierLedger(currentBill.supplier_id, user.id)
      } catch (e) {
        console.error('Ledger recalculation failed after bill update:', e)
      }
    }

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

    // Fetch bill to get supplier_id before deletion
    // Only filter by id — RLS (accessible_owner_ids) handles read access
    const { data: bill, error: fetchError } = await supabase
      .from('bills')
      .select('id, supplier_id, owner_id, file_url')
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

    // Note: file cleanup would require fetching file_path from storage metadata
    // This is non-critical since files can be cleaned up separately

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete bill' }, { status: 500 })
  }
}
