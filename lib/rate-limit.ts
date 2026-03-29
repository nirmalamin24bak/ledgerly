/**
 * Simple in-memory rate limiter.
 * For production scale (multiple serverless instances), replace with
 * Redis via Upstash or Vercel KV. This works correctly for single-instance dev
 * and provides basic protection on Vercel (each region instance has its own store).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt }
}

/**
 * Rate limit presets for different route types.
 * Usage: const { allowed } = checkRateLimit(userId, LIMITS.AI.max, LIMITS.AI.windowMs)
 */
export const LIMITS = {
  AI:       { max: 20,  windowMs: 60_000 },   // 20 AI requests per minute
  UPLOAD:   { max: 10,  windowMs: 60_000 },   // 10 uploads per minute
  WRITE:    { max: 60,  windowMs: 60_000 },   // 60 writes per minute
  READ:     { max: 120, windowMs: 60_000 },   // 120 reads per minute
}
