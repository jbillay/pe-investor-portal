import { SetMetadata } from '@nestjs/common';
import {
  RateLimit,
  StrictRateLimit,
  ModerateRateLimit,
  LenientRateLimit,
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from './rate-limit.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Rate Limit Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RateLimit', () => {
    it('should set metadata with rate limit options', () => {
      const options: RateLimitOptions = {
        limit: 10,
        window: 60,
      };

      RateLimit(options);

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, options);
    });

    it('should handle custom key generator', () => {
      const options: RateLimitOptions = {
        limit: 50,
        window: 300,
        keyGenerator: 'custom-key',
      };

      RateLimit(options);

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, options);
    });

    it('should handle skipIf condition', () => {
      const options: RateLimitOptions = {
        limit: 100,
        window: 3600,
        skipIf: 'isAdmin',
      };

      RateLimit(options);

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, options);
    });
  });

  describe('StrictRateLimit', () => {
    it('should set strict rate limit (5 requests per 5 minutes)', () => {
      StrictRateLimit();

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, {
        limit: 5,
        window: 300,
      });
    });
  });

  describe('ModerateRateLimit', () => {
    it('should set moderate rate limit (100 requests per minute)', () => {
      ModerateRateLimit();

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, {
        limit: 100,
        window: 60,
      });
    });
  });

  describe('LenientRateLimit', () => {
    it('should set lenient rate limit (1000 requests per hour)', () => {
      LenientRateLimit();

      expect(SetMetadata).toHaveBeenCalledWith(RATE_LIMIT_KEY, {
        limit: 1000,
        window: 3600,
      });
    });
  });
});
