import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

function isValidUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

const RenameSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = RenameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid project name' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ledger_projects')
      .update({ name: parsed.data.name })
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to rename project' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: project } = await supabase
      .from('ledger_projects')
      .select('id')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Prevent deletion if project has data
    const [{ count: billCount }, { count: supplierCount }] = await Promise.all([
      supabase.from('bills').select('*', { count: 'exact', head: true })
        .eq('project_id', params.id).eq('owner_id', user.id),
      supabase.from('suppliers').select('*', { count: 'exact', head: true })
        .eq('project_id', params.id).eq('owner_id', user.id),
    ])

    if ((billCount ?? 0) > 0 || (supplierCount ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a project that has bills or suppliers. Remove them first.' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('ledger_projects')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 })
  }
}
