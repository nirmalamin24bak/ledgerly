import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLedgerEntry } from '@/lib/ledger'
import { verifyProjectOwnership } from '@/lib/project'
import { cookies } from 'next/headers'
import { z } from 'zod'

const PAGE_SIZE = 50

const PaymentSchema = z.object({
  supplier_id: z.string().uuid(),
  bill_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive().max(100_000_000),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  mode: z.enum(['cash', 'cheque', 'neft', 'rtgs', 'upi', 'other']),
  reference_number: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = PaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const projectId = cookies().get('ledgerly_project_id')?.value ?? null

    const [{ data: supplier }, projectValid] = await Promise.all([
      supabase.from('suppliers').select('id').eq('id', parsed.data.supplier_id).eq('owner_id', user.id).single(),
      verifyProjectOwnership(supabase, projectId, user.id),
    ])

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    }
    if (!projectValid) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 403 })
    }

    if (parsed.data.bill_id) {
      const { data: bill } = await supabase
        .from('bills')
        .select('id')
        .eq('id', parsed.data.bill_id)
        .eq('owner_id', user.id)
        .single()

      if (!bill) {
        return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 })
      }
    }

    const { data: payment, error: paymentError } = await supabase
      .from('bill_payments')
      .insert({ ...parsed.data, owner_id: user.id, ...(projectId ? { project_id: projectId } : {}) })
      .select()
      .single()

    if (paymentError) throw paymentError

    await createLedgerEntry({
      supplier_id: parsed.data.supplier_id,
      owner_id: user.id,
      type: 'credit',
      reference_type: 'payment',
      reference_id: payment.id,
      amount: parsed.data.amount,
      entry_date: parsed.data.payment_date,
      description: `Payment via ${parsed.data.mode.toUpperCase()}${parsed.data.reference_number ? ` (${parsed.data.reference_number})` : ''}`,
      project_id: projectId,
    })

    // Update bill status if bill_id provided
    if (parsed.data.bill_id) {
      const { data: bill } = await supabase
        .from('bills')
        .select('total_amount, tds_amount')
        .eq('id', parsed.data.bill_id)
        .single()

      if (bill) {
        const { data: billPayments } = await supabase
          .from('bill_payments')
          .select('amount')
          .eq('bill_id', parsed.data.bill_id)

        const totalPaid = (billPayments ?? []).reduce((s, p) => s + Number(p.amount), 0)
        const netPayable = Number(bill.total_amount) - Number(bill.tds_amount)
        const status = totalPaid >= netPayable ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'

        await supabase.from('bills').update({ status }).eq('id', parsed.data.bill_id).eq('owner_id', user.id)
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

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    const { data, error, count } = await supabase
      .from('bill_payments')
      .select('*, supplier:suppliers(id, name), bill:bills(id, invoice_number)', { count: 'exact' })
      .in('owner_id', ownerIds)
      .order('payment_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize: PAGE_SIZE, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
  }
}
