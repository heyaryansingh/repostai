/**
 * Rate limiting utility for API endpoints
 * Implements token bucket algorithm with Redis fallback
 */

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  identifier: string;  // User ID, IP, or API key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

class InMemoryRateLimiter {
  private buckets: Map<string, { count: number; resetAt: number }> = new Map();

  check(config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = config.identifier;

    let bucket = this.buckets.get(key);

    // Create new bucket or reset if expired
    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      this.buckets.set(key, bucket);
    }

    // Check if under limit
    if (bucket.count < config.maxRequests) {
      bucket.count++;
      return {
        allowed: true,
        remaining: config.maxRequests - bucket.count,
        resetAt: new Date(bucket.resetAt),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.resetAt),
    };
  }

  // Cleanup expired buckets periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
      }
    }
  }
}

// Singleton instance
const limiter = new InMemoryRateLimiter();

// Cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => limiter.cleanup(), 60000);
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  return limiter.check(config);
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: Omit<RateLimitConfig, 'identifier'>) {
  return async (identifier: string): Promise<RateLimitResult> => {
    return checkRateLimit({ ...config, identifier });
  };
}

// Predefined rate limiters
export const apiRateLimit = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60,
});

export const authRateLimit = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
});

export const webhookRateLimit = createRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 10,
});
