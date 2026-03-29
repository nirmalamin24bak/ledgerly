import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Returns a short-lived signed URL for a bill's file.
 * Files are stored privately — never expose public URLs for financial documents.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate UUID
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 })
    }

    // Get bill — RLS ensures only accessible bills are returned
    const { data: bill } = await supabase
      .from('bills')
      .select('file_path, file_name')
      .eq('id', params.id)
      .single()

    if (!bill?.file_path) {
      return NextResponse.json({ error: 'No file attached to this bill' }, { status: 404 })
    }

    // Generate signed URL — expires in 5 minutes
    const service = createServiceClient()
    const { data, error } = await service.storage
      .from('bills')
      .createSignedUrl(bill.file_path, 300) // 300 seconds = 5 min

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate file URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl, name: bill.file_name })
  } catch {
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 })
  }
}
