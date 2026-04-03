import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createLedgerEntry } from '@/lib/ledger'
import { verifyProjectOwnership } from '@/lib/project'
import { cookies } from 'next/headers'
import { z } from 'zod'
import path from 'path'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const PAGE_SIZE = 50

const BillSchema = z.object({
  supplier_id: z.string().uuid(),
  invoice_number: z.string().max(100).nullable().optional(),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  total_amount: z.number().min(0).max(100_000_000),
  taxable_amount: z.number().min(0).default(0),
  cgst_amount: z.number().min(0).default(0),
  sgst_amount: z.number().min(0).default(0),
  igst_amount: z.number().min(0).default(0),
  gst_amount: z.number().min(0).default(0),
  tds_applicable: z.boolean().default(false),
  tds_rate: z.number().min(0).max(100).nullable().optional(),
  tds_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).nullable().optional(),
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

    // Safe JSON parse
    let rawData: unknown
    try {
      rawData = JSON.parse(dataStr)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request' }, { status: 400 })
    }

    const parsed = BillSchema.safeParse(rawData)
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

    // Handle file upload
    let file_path: string | null = null
    let file_name: string | null = null
    const file = formData.get('file') as File | null

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File too large. Maximum 10MB.' }, { status: 400 })
      }

      const ext = path.extname(file.name).replace('.', '').toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ success: false, error: 'Invalid file type. Use JPG, PNG, WebP, or PDF.' }, { status: 400 })
      }

      const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`
      const serviceClient = createServiceClient()

      const { error: uploadError } = await serviceClient.storage
        .from('bills')
        .upload(storagePath, await file.arrayBuffer(), {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('File upload error:', uploadError.message)
      } else {
        file_path = storagePath
        file_name = file.name.slice(0, 255)
      }
    }

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        ...parsed.data,
        owner_id: user.id,
        file_name,
        file_url: null,
        ...(projectId ? { project_id: projectId } : {}),
      })
      .select()
      .single()

    if (billError) {
      if (billError.code === '23505') {
        return NextResponse.json({ success: false, error: 'Invoice number already exists for this supplier' }, { status: 409 })
      }
      console.error('Bill insert error:', billError)
      return NextResponse.json({ success: false, error: billError.message || 'Failed to save bill' }, { status: 500 })
    }

    // Store file_path in a separate UPDATE to avoid schema cache issues on fresh columns
    if (file_path) {
      await supabase.from('bills').update({ file_path }).eq('id', bill.id)
    }

    try {
      await createLedgerEntry({
        supplier_id: parsed.data.supplier_id,
        owner_id: user.id,
        type: 'debit',
        reference_type: 'bill',
        reference_id: bill.id,
        amount: parsed.data.total_amount,
        entry_date: parsed.data.invoice_date ?? new Date().toISOString().split('T')[0],
        description: `Bill #${parsed.data.invoice_number ?? bill.id.substring(0, 8)}`,
        project_id: projectId,
      })
    } catch (ledgerErr) {
      console.error('Ledger entry failed — rolling back bill:', ledgerErr)
      await supabase.from('bills').delete().eq('id', bill.id)
      const msg = ledgerErr instanceof Error ? ledgerErr.message : 'Failed to update ledger'
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: bill })
  } catch (error) {
    console.error('POST /api/bills:', error)
    const msg = error instanceof Error ? error.message : 'Failed to create bill'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Validate status param
    if (status && !['pending', 'paid', 'partial'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status filter' }, { status: 400 })
    }
    // Validate supplier_id param
    if (supplier_id && !/^[0-9a-f-]{36}$/i.test(supplier_id)) {
      return NextResponse.json({ success: false, error: 'Invalid supplier_id' }, { status: 400 })
    }

    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    let query = supabase
      .from('bills')
      .select('*, supplier:suppliers(id, name, gst_number, category)', { count: 'exact' })
      .in('owner_id', ownerIds)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)
    if (supplier_id) query = query.eq('supplier_id', supplier_id)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize: PAGE_SIZE, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE_SIZE) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 })
  }
}
