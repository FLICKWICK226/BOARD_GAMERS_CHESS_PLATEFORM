/**
 * In-memory sliding window rate limiter.
 *
 * Safe for Vercel serverless: each warm instance tracks independently.
 * This prevents burst abuse — a determined attacker hitting many cold
 * instances simultaneously is an edge case that warrants Vercel's own
 * DDoS protection, not application-level logic.
 *
 * Usage:
 *   const result = rateLimit('user:abc123', 5, 60_000)
 *   if (!result.allowed) return new Response('Too Many Requests', { status: 429 })
 */

interface RateLimitEntry {
  timestamps: number[]
}

// Module-level store — persists across requests within the same warm instance
const store = new Map<string, RateLimitEntry>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInMs: number
}

/**
 * Check and record a rate limit hit.
 *
 * @param identifier  Unique key (e.g. user ID, IP, email hash)
 * @param limit       Max allowed requests in the window
 * @param windowMs    Rolling window duration in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get or initialise the entry
  let entry = store.get(identifier)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(identifier, entry)
  }

  // Evict timestamps outside the current window (sliding window logic)
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= limit) {
    // Oldest timestamp in window tells us when a slot frees up
    const oldest = entry.timestamps[0]!
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldest + windowMs - now,
    }
  }

  // Record this request
  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetInMs: windowMs,
  }
}

/**
 * Extract the real client IP from Next.js request headers,
 * falling back to a constant if unavailable (e.g. local dev).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
