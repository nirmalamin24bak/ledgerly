import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { nlToSql } from '@/lib/ai'
import { z } from 'zod'

const QuerySchema = z.object({
  query: z.string().min(1).max(500),
})

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = QuerySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
    }

    // Get accessible owner IDs
    const { data: accessRows } = await supabase
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    // Convert NL → SQL
    const { sql, explanation } = await nlToSql(parsed.data.query, ownerIds)

    // Execute the generated SQL via service client (controlled environment)
    const serviceClient = createServiceClient()
    const { data: rows, error } = await serviceClient.rpc('execute_user_query', {
      p_sql: sql,
    })

    // Fallback: if RPC doesn't exist, execute raw
    // NOTE: In production, use the RPC approach or a query builder
    if (error && error.message.includes('function execute_user_query')) {
      // Direct execution fallback (only safe because nlToSql validates SELECT-only)
      const result = await serviceClient.from('bills').select('*').limit(0) // dummy to get client
      // We can't easily run raw SQL via supabase-js without RPC
      return NextResponse.json({
        success: true,
        data: {
          explanation,
          rows: [],
          note: 'To enable AI query execution, create the execute_user_query RPC in Supabase. See README.',
        },
      })
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { explanation, rows: rows ?? [] },
    })
  } catch (error) {
    console.error('ai-query error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
