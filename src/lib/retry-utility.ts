/**
 * Retry utility for handling transient API failures
 *
 * Provides exponential backoff retry logic for API calls with
 * configurable retries, delays, and error filtering.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('rate limit')
      );
    }
    return false;
  },
};

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error isn't retryable
      if (!opts.retryableErrors(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      // Call retry callback if provided
      options.onRetry?.(error, attempt + 1);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry an API fetch with automatic error detection
 *
 * @param url - URL to fetch
 * @param init - Fetch options
 * @param options - Retry configuration
 * @returns Promise resolving to Response
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);

      // Retry on server errors (5xx) and rate limiting (429)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      ...options,
      retryableErrors: (error: unknown) => {
        if (error instanceof Error) {
          const message = error.message;
          return (
            message.includes('HTTP 5') ||
            message.includes('429') ||
            message.includes('timeout') ||
            message.includes('network')
          );
        }
        return false;
      },
    }
  );
}

/**
 * Batch retry - retry multiple operations with shared settings
 *
 * @param operations - Array of async functions to retry
 * @param options - Retry configuration
 * @returns Promise resolving to array of results
 */
export async function retryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(
    operations.map((op) => retryWithBackoff(op, options))
  );
}

/**
 * Circuit breaker pattern - fail fast after consecutive failures
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      resetTimeout?: number;
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.options.failureThreshold = options.failureThreshold ?? 5;
    this.options.resetTimeout = options.resetTimeout ?? 60000; // 1 minute
  }

  async execute(): Promise<T> {
    // Check if circuit should reset
    if (
      this.state === 'open' &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime > this.options.resetTimeout!
    ) {
      this.state = 'half-open';
      this.failureCount = 0;
    }

    // Fail fast if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is OPEN - too many recent failures');
    }

    try {
      const result = await retryWithBackoff(this.fn, this.options.retryOptions);

      // Success - reset failure count
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
      this.failureCount = 0;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failureCount >= this.options.failureThreshold!) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
