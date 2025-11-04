import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom IP-based Throttler Guard
 *
 * This guard extends the default ThrottlerGuard to track rate limits by IP address
 * instead of by route. This prevents attackers from bypassing rate limits by
 * hitting multiple routes from the same IP address.
 *
 * Features:
 * - Tracks rate limits by IP address globally across all routes
 * - Respects X-Forwarded-For header for proxied requests
 * - Falls back to connection IP if proxy headers are not present
 * - Works with Redis storage for distributed rate limiting
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  /**
   * Generate a unique tracker key based on the client's IP address
   *
   * @param context - The execution context containing request information
   * @returns A unique key string for tracking this client's requests
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Extract IP address from various sources (proxy-aware)
    const ip = this.getClientIp(req);

    // Return IP as the tracking key - all requests from this IP will be counted together
    return ip;
  }

  /**
   * Extract client IP address from request, accounting for proxies
   *
   * @param req - The request object
   * @returns The client's IP address
   */
  private getClientIp(req: Record<string, any>): string {
    // Check X-Forwarded-For header (from proxy/load balancer)
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      // Take the first IP in the chain (original client)
      return forwardedFor.split(',')[0].trim();
    }

    // Check X-Real-IP header (alternative proxy header)
    const realIp = req.headers?.['x-real-ip'];
    if (realIp) {
      return realIp.trim();
    }

    // Fall back to connection remote address
    return (
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}
