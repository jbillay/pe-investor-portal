import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie Pattern for CSRF protection.
 * This prevents Cross-Site Request Forgery attacks by requiring a valid CSRF token
 * for all state-changing operations (POST, PUT, DELETE, PATCH).
 *
 * How it works:
 * 1. Server generates a CSRF token and stores it in an httpOnly cookie
 * 2. Server also sends the token to the client (via /api/auth/csrf endpoint)
 * 3. Client must include the token in the X-CSRF-Token header for state-changing requests
 * 4. Server validates that the header token matches the cookie token
 *
 * Security features:
 * - httpOnly cookies prevent XSS attacks from stealing tokens
 * - SameSite=Strict prevents cross-origin requests
 * - Tokens are cryptographically secure random values
 * - Public routes (login, register) are excluded
 */

// Configure CSRF protection with Double Submit Cookie pattern
// __Host- prefix requires HTTPS, so we only use it in production
const isProduction = process.env.NODE_ENV === 'production';
const cookieName = isProduction
  ? '__Host-pe-portal.x-csrf-token'
  : 'pe-portal.x-csrf-token';

const {
  generateCsrfToken, // Function to generate CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF token
} = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: (req: Request) => req.ip || 'anonymous',
  cookieName,
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction, // HTTPS only in production
    path: '/',
  },
  size: 64, // Token size in bytes (512 bits)
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Only protect state-changing methods
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string, // Token in header
});

// Export token generation function for use in controllers
// This creates a middleware that attaches req.csrfToken() function
export const csrfTokenGenerator = (req: Request, res: Response, next: NextFunction) => {
  req.csrfToken = (options) => generateCsrfToken(req, res, options);
  next();
};

/**
 * NestJS Middleware wrapper for CSRF protection
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for public routes (authentication endpoints)
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/csrf',
      '/health',
      '/api-docs',
    ];

    // Use req.originalUrl to get the full request path (includes /api prefix)
    const requestPath = req.originalUrl || req.url;

    const isPublicRoute = publicRoutes.some((route) => requestPath.startsWith(route));

    if (isPublicRoute) {
      return next();
    }

    // Apply CSRF protection for non-public routes
    doubleCsrfProtection(req, res, next);
  }
}
