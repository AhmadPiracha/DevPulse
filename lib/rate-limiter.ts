// In-memory rate limiter for demonstration purposes.
// NOT suitable for multi-instance production environments.
// For production, consider using Redis (e.g., Upstash Redis) or a dedicated service.

interface RateLimitEntry {
  count: number
  lastReset: number
}

const requests = new Map<string, { count: number; lastReset: number }>()
export const WINDOW_MS = 60 * 1000 // 1 minute
export const MAX_REQUESTS = 100 // Max 100 requests per minute per IP

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const client = requests.get(ip) || { count: 0, lastReset: now }

  if (now - client.lastReset > WINDOW_MS) {
    client.count = 1
    client.lastReset = now
  } else {
    client.count++
  }

  requests.set(ip, client)

  return client.count > MAX_REQUESTS
}

// Optional: Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of requests.entries()) {
    if (now - entry.lastReset > WINDOW_MS * 2) {
      // Remove entries older than 2 windows
      requests.delete(key)
    }
  }
}, WINDOW_MS)
