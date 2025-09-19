import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  /** Number of requests allowed */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Custom key for rate limiting (optional) */
  keyGenerator?: string;
  /** Skip rate limiting if condition is met */
  skipIf?: string;
}

/**
 * Decorator to apply rate limiting to endpoints
 * @param options - Rate limiting configuration
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Strict rate limiting for sensitive operations
 * 5 requests per 5 minutes
 */
export const StrictRateLimit = () =>
  RateLimit({ limit: 5, window: 300 });

/**
 * Moderate rate limiting for standard operations
 * 100 requests per minute
 */
export const ModerateRateLimit = () =>
  RateLimit({ limit: 100, window: 60 });

/**
 * Lenient rate limiting for read operations
 * 1000 requests per hour
 */
export const LenientRateLimit = () =>
  RateLimit({ limit: 1000, window: 3600 });