import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { routeScan, ScanLimitError } from '@/lib/scan/router'
import { Plan } from '@/lib/scan/usage'
import { checkRateLimit, LIMITS } from '@/lib/rate-limit'
import { User } from '@supabase/supabase-js'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const maxDuration = 60

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

    // Rate limit: 10 scans per minute per user
    const { allowed } = checkRateLimit(`scan:${user.id}`, LIMITS.UPLOAD.max, LIMITS.UPLOAD.windowMs)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many scan requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type. Use JPG, PNG, WebP, or PDF.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: 'Invalid file extension.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const plan = (user.user_metadata?.plan ?? 'free') as Plan
    const result = await routeScan(buffer, file.type, user.id, plan)

    return NextResponse.json({ success: true, data: result.data, model_used: result.modelUsed })
  } catch (error) {
    if (error instanceof ScanLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          plan: error.plan,
          limit: error.limit,
        },
        { status: 402 }
      )
    }
    console.error('scan-bill error:', error)
    const message = error instanceof Error ? error.message : 'Scan failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
