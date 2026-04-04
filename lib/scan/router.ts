import { scanWithText, scanWithVision } from '@/lib/ai'
import { getScanCount, incrementScanCount, getCurrentYearMonth, PLAN_LIMITS, Plan } from './usage'
import { ExtractedBillData } from '@/types'

export type ScanRouterResult = {
  data: ExtractedBillData
  modelUsed: string
}

export class ScanLimitError extends Error {
  constructor(
    public readonly plan: Plan,
    public readonly limit: number
  ) {
    super(`Monthly scan limit reached (${limit} scans on ${plan} plan)`)
    this.name = 'ScanLimitError'
  }
}

export async function routeScan(
  file: Buffer,
  mimeType: string,
  userId: string,
  plan: Plan
): Promise<ScanRouterResult> {
  // 1. Enforce monthly limit
  const yearMonth = getCurrentYearMonth()
  const limit = PLAN_LIMITS[plan]
  if (limit !== Infinity) {
    const count = await getScanCount(userId, yearMonth)
    if (count >= limit) {
      throw new ScanLimitError(plan, limit)
    }
  }

  let result: Awaited<ReturnType<typeof scanWithVision>>

  // 2. Route by file type and plan
  if (mimeType === 'application/pdf' && plan !== 'free') {
    // Pro+: try text extraction for digital PDFs first
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
      const parsed = await pdfParse(file)
      if (parsed.text && parsed.text.trim().length > 100) {
        result = await scanWithText(parsed.text)
      } else {
        // Scanned/image-only PDF — fall through to vision
        result = await scanWithVision(file.toString('base64'), mimeType, 'haiku')
      }
    } catch {
      // pdf-parse failed — fall through to vision
      result = await scanWithVision(file.toString('base64'), mimeType, 'haiku')
    }
  } else {
    // Image or Free plan — Haiku Vision
    result = await scanWithVision(file.toString('base64'), mimeType, 'haiku')
  }

  // 3. Enterprise fallback: retry with Opus if too many critical fields are null
  if (plan === 'enterprise' && result.nullCount >= 3) {
    try {
      const opusResult = await scanWithVision(file.toString('base64'), mimeType, 'opus')
      if (opusResult.nullCount < result.nullCount) {
        result = opusResult
      }
    } catch {
      // Keep original result if Opus fails
    }
  }

  // 4. Increment usage counter (non-fatal if it fails)
  try {
    await incrementScanCount(userId, yearMonth)
  } catch {
    console.error('Failed to increment scan count for user:', userId)
  }

  return { data: result.data, modelUsed: result.modelUsed }
}
