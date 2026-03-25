/**
 * Production-grade rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipOnSuccess?: boolean; // Don't count successful requests
}

export class RateLimiter {
  private static requests = new Map<string, RateLimitEntry>();

  private static readonly configs: Record<string, RateLimitConfig> = {
    // Auth endpoints - strict limits
    'auth': { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes

    // BMAD API endpoints - moderate limits
    'bmad': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute

    // Session management - higher limits for active users
    'session': { windowMs: 60 * 1000, maxRequests: 120 }, // 120 requests per minute

    // Session creation - stricter limit
    'session-create': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute

    // Default fallback
    'default': { windowMs: 60 * 1000, maxRequests: 30 } // 30 requests per minute
  };

  /**
   * Check if request should be rate limited
   */
  static checkRateLimit(
    identifier: string,
    type: keyof typeof RateLimiter.configs = 'default'
  ): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const config = this.configs[type];
    const now = Date.now();
    const key = `${type}:${identifier}`;

    // Clean up expired entries periodically
    this.cleanup();

    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.requests.set(key, newEntry);

      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment counter
    entry.count++;
    this.requests.set(key, entry);

    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private static cleanup(): void {
    const now = Date.now();

    // Only run cleanup every 5 minutes to avoid performance impact
    const lastCleanupKey = '_lastCleanup';
    const lastCleanup = this.requests.get(lastCleanupKey)?.resetTime || 0;

    if (now - lastCleanup < 5 * 60 * 1000) {
      return;
    }

    for (const [key, entry] of this.requests.entries()) {
      if (key !== lastCleanupKey && now > entry.resetTime) {
        this.requests.delete(key);
      }
    }

    // Update last cleanup time
    this.requests.set(lastCleanupKey, { count: 0, resetTime: now });
  }

  /**
   * Get rate limit info without incrementing counter
   */
  static getRateLimitInfo(
    identifier: string,
    type: keyof typeof RateLimiter.configs = 'default'
  ): { remainingRequests: number; resetTime: number } {
    const config = this.configs[type];
    const key = `${type}:${identifier}`;
    const entry = this.requests.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        remainingRequests: config.maxRequests,
        resetTime: now + config.windowMs
      };
    }

    return {
      remainingRequests: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for specific identifier (admin use)
   */
  static resetRateLimit(identifier: string, type: keyof typeof RateLimiter.configs): void {
    const key = `${type}:${identifier}`;
    this.requests.delete(key);
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRateLimit<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  type: keyof typeof RateLimiter['configs'] = 'default'
) {
  return async (...args: T): Promise<Response> => {
    const [request] = args;

    // Extract identifier (IP address + user agent for anonymous, user ID if authenticated)
    const identifier = getRateLimitIdentifier(request);

    const { allowed, remainingRequests, resetTime } = RateLimiter.checkRateLimit(identifier, type);

    if (!allowed) {
      const resetDate = new Date(resetTime);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(RateLimiter.configs[type].maxRequests),
            'X-RateLimit-Remaining': String(remainingRequests),
            'X-RateLimit-Reset': resetDate.toISOString(),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    const response = await handler(...args);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(RateLimiter.configs[type].maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remainingRequests));
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return response;
  };
}

/**
 * Extract identifier for rate limiting
 */
function getRateLimitIdentifier(request: any): string {
  // Try to get user ID from authenticated request
  const userId = request.user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP + User Agent hash for anonymous users
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Simple hash to avoid storing full user agent strings
  const hash = simpleHash(`${ip}:${userAgent}`);
  return `anonymous:${hash}`;
}

/**
 * Simple hash function for rate limiting identifiers
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}