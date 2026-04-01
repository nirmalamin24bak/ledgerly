import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { nlToSql } from '@/lib/ai'
import { checkRateLimit, LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'
import { User } from '@supabase/supabase-js'

const QuerySchema = z.object({
  query: z.string().min(1).max(500),
})

export const maxDuration = 30

async function getUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const service = createServiceClient()
    const { data } = await service.auth.getUser(token)
    return data.user
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 20 AI queries per minute per user
    const { allowed, remaining } = checkRateLimit(`ai:${user.id}`, LIMITS.AI.max, LIMITS.AI.windowMs)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': '60' } }
      )
    }

    let body: unknown
    try { body = await req.json() }
    catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = QuerySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: accessRows } = await serviceClient
      .from('accountant_access')
      .select('owner_id')
      .eq('accountant_id', user.id)
    const ownerIds = [user.id, ...(accessRows?.map(r => r.owner_id) ?? [])]

    const { sql, explanation } = await nlToSql(parsed.data.query, ownerIds)

    const { data: rows, error } = await serviceClient.rpc('execute_user_query', { p_sql: sql })

    if (error && error.message.includes('execute_user_query')) {
      return NextResponse.json({
        success: true,
        data: {
          explanation,
          rows: [],
          note: 'AI query execution requires the execute_user_query RPC. See README.',
        },
      })
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { explanation, rows: rows ?? [] },
      meta: { 'x-ratelimit-remaining': remaining },
    })
  } catch (error) {
    console.error('ai-query error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
