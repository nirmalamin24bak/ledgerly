import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBillData } from '@/lib/ai'
import { checkRateLimit, LIMITS } from '@/lib/rate-limit'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
    const extracted = await extractBillData(buffer, file.type)

    return NextResponse.json({ success: true, data: extracted })
  } catch (error) {
    console.error('scan-bill error:', error)
    const message = error instanceof Error ? error.message : 'Scan failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
