import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createLedgerEntry } from '@/lib/ledger'
import { z } from 'zod'

const BillSchema = z.object({
  supplier_id: z.string().uuid(),
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z.number().min(0),
  taxable_amount: z.number().min(0).default(0),
  cgst_amount: z.number().min(0).default(0),
  sgst_amount: z.number().min(0).default(0),
  igst_amount: z.number().min(0).default(0),
  gst_amount: z.number().min(0).default(0),
  tds_applicable: z.boolean().default(false),
  tds_rate: z.number().nullable().optional(),
  tds_amount: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  raw_extracted_data: z.any().nullable().optional(),
})

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const dataStr = formData.get('data') as string
    if (!dataStr) return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 })

    const rawData = JSON.parse(dataStr)
    const parsed = BillSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Verify supplier belongs to accessible owners
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, owner_id')
      .eq('id', parsed.data.supplier_id)
      .single()

    if (!supplier) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })

    // Handle file upload to Supabase Storage
    let file_url: string | null = null
    let file_name: string | null = null
    const file = formData.get('file') as File | null

    if (file) {
      const serviceClient = createServiceClient()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await serviceClient.storage
        .from('bills')
        .upload(path, await file.arrayBuffer(), {
          contentType: file.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = serviceClient.storage.from('bills').getPublicUrl(path)
        file_url = urlData.publicUrl
        file_name = file.name
      }
    }

    // Insert bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        ...parsed.data,
        owner_id: user.id,
        file_url,
        file_name,
      })
      .select()
      .single()

    if (billError) throw billError

    // Create ledger debit entry
    await createLedgerEntry({
      supplier_id: parsed.data.supplier_id,
      owner_id: user.id,
      type: 'debit',
      reference_type: 'bill',
      reference_id: bill.id,
      amount: parsed.data.total_amount,
      entry_date: parsed.data.invoice_date ?? new Date().toISOString().split('T')[0],
      description: `Bill #${parsed.data.invoice_number ?? bill.id.substring(0, 8)}`,
    })

    return NextResponse.json({ success: true, data: bill })
  } catch (error) {
    console.error('POST /api/bills:', error)
    return NextResponse.json({ success: false, error: 'Failed to create bill' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const supplier_id = searchParams.get('supplier_id')

    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    let query = supabase
      .from('bills')
      .select('*, supplier:suppliers(id, name, gst_number, category)')
      .in('owner_id', ownerIds)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (supplier_id) query = query.eq('supplier_id', supplier_id)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 })
  }
}
