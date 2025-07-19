// In-memory rate limiter for demonstration purposes.
// NOT suitable for multi-instance production environments.
// For production, consider using Redis (e.g., Upstash Redis) or a dedicated service.

interface RateLimitEntry {
  count: number
  lastReset: number
}

const limits = new Map<string, RateLimitEntry>() // key: userId or IP, value: { count, lastReset }
export const WINDOW_MS = 60 * 1000 // 1 minute
export const MAX_REQUESTS = 10 // Max 10 requests per minute per user/IP

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAfter: number } {
  const now = Date.now()
  let entry = limits.get(identifier)

  if (!entry || now - entry.lastReset > WINDOW_MS) {
    // Reset or initialize if window expired
    entry = { count: 0, lastReset: now }
    limits.set(identifier, entry)
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count++
    const remaining = MAX_REQUESTS - entry.count
    const resetAfter = WINDOW_MS - (now - entry.lastReset)
    return { allowed: true, remaining, resetAfter }
  } else {
    const remaining = 0
    const resetAfter = WINDOW_MS - (now - entry.lastReset)
    return { allowed: false, remaining, resetAfter }
  }
}

// Optional: Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of limits.entries()) {
    if (now - entry.lastReset > WINDOW_MS * 2) {
      // Remove entries older than 2 windows
      limits.delete(key)
    }
  }
}, WINDOW_MS)
