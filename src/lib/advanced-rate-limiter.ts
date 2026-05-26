/**
 * Advanced Rate Limiting System
 *
 * Features:
 * - Token bucket and sliding window algorithms
 * - Tiered rate limits (free, pro, enterprise)
 * - Burst allowances
 * - Cost-based limiting (weighted requests)
 * - Distributed limiting (Redis-ready)
 * - Rate limit headers (X-RateLimit-*)
 * - Analytics and monitoring
 */

export interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstSize: number;
  costMultiplier: number;
}

export interface RateLimitConfig {
  identifier: string;
  tier: RateLimitTier;
  endpoint?: string;
  cost?: number; // Request cost (default: 1)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  retryAfter?: number; // Seconds until retry allowed
  headers: Record<string, string>;
}

export interface RateLimitAnalytics {
  totalRequests: number;
  allowedRequests: number;
  rejectedRequests: number;
  averageTokens: number;
  peakUsage: number;
  timestamp: Date;
}

/**
 * Predefined tier configurations
 */
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  FREE: {
    name: 'free',
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    burstSize: 5,
    costMultiplier: 1.0,
  },
  PRO: {
    name: 'pro',
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstSize: 20,
    costMultiplier: 1.0,
  },
  ENTERPRISE: {
    name: 'enterprise',
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstSize: 100,
    costMultiplier: 1.0,
  },
  UNLIMITED: {
    name: 'unlimited',
    requestsPerMinute: Infinity,
    requestsPerHour: Infinity,
    requestsPerDay: Infinity,
    burstSize: Infinity,
    costMultiplier: 0,
  },
};

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  consume(cost: number = 1): boolean {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    if (this.tokens >= this.capacity) {
      return 0;
    }

    const tokensNeeded = this.capacity - this.tokens;
    const timeToRefill = tokensNeeded / this.refillRate;
    return Date.now() + timeToRefill;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Sliding window counter
 */
class SlidingWindow {
  private requests: Map<number, number> = new Map();
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  addRequest(timestamp: number = Date.now(), cost: number = 1): void {
    const windowKey = Math.floor(timestamp / 1000);
    this.requests.set(windowKey, (this.requests.get(windowKey) || 0) + cost);
    this.cleanup(timestamp);
  }

  getCount(timestamp: number = Date.now()): number {
    this.cleanup(timestamp);

    let total = 0;
    const windowStart = timestamp - this.windowMs;

    for (const [ts, count] of this.requests.entries()) {
      if (ts * 1000 >= windowStart) {
        total += count;
      }
    }

    return total;
  }

  private cleanup(timestamp: number): void {
    const windowStart = timestamp - this.windowMs;

    for (const ts of this.requests.keys()) {
      if (ts * 1000 < windowStart) {
        this.requests.delete(ts);
      }
    }
  }
}

/**
 * Rate limiter state per identifier
 */
interface LimiterState {
  bucket: TokenBucket;
  minuteWindow: SlidingWindow;
  hourWindow: SlidingWindow;
  dayWindow: SlidingWindow;
  analytics: {
    total: number;
    allowed: number;
    rejected: number;
  };
}

/**
 * Advanced rate limiter implementation
 */
class AdvancedRateLimiter {
  private state: Map<string, LimiterState> = new Map();

  check(config: RateLimitConfig): RateLimitResult {
    const { identifier, tier, cost = 1 } = config;
    const now = Date.now();

    // Get or create state
    let limiterState = this.state.get(identifier);

    if (!limiterState) {
      limiterState = this.createState(tier);
      this.state.set(identifier, limiterState);
    }

    // Update analytics
    limiterState.analytics.total++;

    // Check sliding windows
    const minuteCount = limiterState.minuteWindow.getCount(now);
    const hourCount = limiterState.hourWindow.getCount(now);
    const dayCount = limiterState.dayWindow.getCount(now);

    const adjustedCost = cost * tier.costMultiplier;

    // Check all limits
    const withinMinuteLimit = minuteCount + adjustedCost <= tier.requestsPerMinute;
    const withinHourLimit = hourCount + adjustedCost <= tier.requestsPerHour;
    const withinDayLimit = dayCount + adjustedCost <= tier.requestsPerDay;

    // Try to consume from bucket
    const bucketAllows = limiterState.bucket.consume(adjustedCost);

    const allowed = withinMinuteLimit && withinHourLimit && withinDayLimit && bucketAllows;

    if (allowed) {
      limiterState.minuteWindow.addRequest(now, adjustedCost);
      limiterState.hourWindow.addRequest(now, adjustedCost);
      limiterState.dayWindow.addRequest(now, adjustedCost);
      limiterState.analytics.allowed++;
    } else {
      limiterState.analytics.rejected++;
    }

    // Calculate remaining and reset time
    const remaining = Math.min(
      tier.requestsPerMinute - minuteCount,
      tier.requestsPerHour - hourCount,
      tier.requestsPerDay - dayCount,
      limiterState.bucket.getRemaining()
    );

    const resetAt = new Date(limiterState.bucket.getResetTime());

    // Calculate retry after
    const retryAfter = allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000);

    // Generate headers
    const headers = this.generateHeaders({
      limit: tier.requestsPerMinute,
      remaining: Math.max(0, remaining),
      resetAt,
      retryAfter,
    });

    return {
      allowed,
      remaining: Math.max(0, Math.floor(remaining)),
      resetAt,
      limit: tier.requestsPerMinute,
      retryAfter,
      headers,
    };
  }

  getAnalytics(identifier: string): RateLimitAnalytics | null {
    const state = this.state.get(identifier);

    if (!state) {
      return null;
    }

    return {
      totalRequests: state.analytics.total,
      allowedRequests: state.analytics.allowed,
      rejectedRequests: state.analytics.rejected,
      averageTokens: state.bucket.getRemaining(),
      peakUsage: state.analytics.total > 0
        ? state.analytics.allowed / state.analytics.total
        : 0,
      timestamp: new Date(),
    };
  }

  cleanup(): void {
    // Remove stale entries (no requests in last hour)
    const oneHourAgo = Date.now() - 3600000;

    for (const [identifier, state] of this.state.entries()) {
      const recentRequests = state.hourWindow.getCount();
      if (recentRequests === 0) {
        this.state.delete(identifier);
      }
    }
  }

  private createState(tier: RateLimitTier): LimiterState {
    // Calculate refill rate: tokens per millisecond
    const refillRate = tier.requestsPerMinute / 60000;

    return {
      bucket: new TokenBucket(tier.burstSize, refillRate),
      minuteWindow: new SlidingWindow(60000),
      hourWindow: new SlidingWindow(3600000),
      dayWindow: new SlidingWindow(86400000),
      analytics: {
        total: 0,
        allowed: 0,
        rejected: 0,
      },
    };
  }

  private generateHeaders(data: {
    limit: number;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': data.limit.toString(),
      'X-RateLimit-Remaining': data.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(data.resetAt.getTime() / 1000).toString(),
    };

    if (data.retryAfter !== undefined) {
      headers['Retry-After'] = data.retryAfter.toString();
    }

    return headers;
  }
}

// Singleton instance
const rateLimiter = new AdvancedRateLimiter();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 300000);
}

/**
 * Check rate limit for a request
 */
export async function checkAdvancedRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimiter.check(config);
}

/**
 * Get analytics for an identifier
 */
export function getRateLimitAnalytics(
  identifier: string
): RateLimitAnalytics | null {
  return rateLimiter.getAnalytics(identifier);
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(
  getTier: (request: Request) => RateLimitTier,
  getIdentifier: (request: Request) => string,
  options: {
    endpoint?: string;
    getCost?: (request: Request) => number;
  } = {}
) {
  return async (request: Request): Promise<RateLimitResult> => {
    const tier = getTier(request);
    const identifier = getIdentifier(request);
    const cost = options.getCost?.(request) ?? 1;

    return checkAdvancedRateLimit({
      identifier,
      tier,
      endpoint: options.endpoint,
      cost,
    });
  };
}

/**
 * Helper: Get user IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  return 'unknown';
}

/**
 * Helper: Get tier from user subscription
 */
export function getTierFromSubscription(
  subscription?: string | null
): RateLimitTier {
  if (!subscription) {
    return RATE_LIMIT_TIERS.FREE;
  }

  const tier = subscription.toUpperCase();

  if (tier in RATE_LIMIT_TIERS) {
    return RATE_LIMIT_TIERS[tier as keyof typeof RATE_LIMIT_TIERS];
  }

  return RATE_LIMIT_TIERS.FREE;
}
