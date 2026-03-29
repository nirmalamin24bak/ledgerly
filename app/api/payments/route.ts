import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLedgerEntry } from '@/lib/ledger'
import { z } from 'zod'

const PaymentSchema = z.object({
  supplier_id: z.string().uuid(),
  bill_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string(),
  mode: z.enum(['cash', 'cheque', 'neft', 'rtgs', 'upi', 'other']),
  reference_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = PaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({ ...parsed.data, owner_id: user.id })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Create ledger credit entry
    await createLedgerEntry({
      supplier_id: parsed.data.supplier_id,
      owner_id: user.id,
      type: 'credit',
      reference_type: 'payment',
      reference_id: payment.id,
      amount: parsed.data.amount,
      entry_date: parsed.data.payment_date,
      description: `Payment via ${parsed.data.mode.toUpperCase()}${parsed.data.reference_number ? ` (${parsed.data.reference_number})` : ''}`,
    })

    // Update bill status if bill_id provided
    if (parsed.data.bill_id) {
      const { data: bill } = await supabase
        .from('bills')
        .select('total_amount, tds_amount')
        .eq('id', parsed.data.bill_id)
        .single()

      if (bill) {
        // Get total payments for this bill
        const { data: billPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('bill_id', parsed.data.bill_id)

        const totalPaid = (billPayments ?? []).reduce((s, p) => s + Number(p.amount), 0)
        const netPayable = Number(bill.total_amount) - Number(bill.tds_amount)

        const status = totalPaid >= netPayable ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'
        await supabase.from('bills').update({ status }).eq('id', parsed.data.bill_id)
      }
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('POST /api/payments:', error)
    return NextResponse.json({ success: false, error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    const { data, error } = await supabase
      .from('payments')
      .select('*, supplier:suppliers(id, name), bill:bills(id, invoice_number)')
      .in('owner_id', ownerIds)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
  }
}
