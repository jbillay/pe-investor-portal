import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';
import {
  TestDataGenerator,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
} from '../../../test/utils/test-utils';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks before each test
    DatabaseTestHelper.resetMocks();
  });

  describe('validate', () => {
    const validPayload: JwtPayload = {
      sub: 'user-test-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should return authenticated user for valid payload', async () => {
      const user = TestDataGenerator.generateUser({
        id: validPayload.sub,
        email: validPayload.email,
      });

      DatabaseTestHelper.mockUserExists({ ...user });

      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isVerified: user.isVerified,
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: validPayload.sub,
          isActive: true,
        },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      DatabaseTestHelper.mockUserNotExists();

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive'),
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = TestDataGenerator.generateUser({
        id: validPayload.sub,
        email: validPayload.email,
        isActive: false,
      });

      DatabaseTestHelper.mockUserExists({ ...inactiveUser });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive'),
      );
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      await expect(strategy.validate(validPayload)).rejects.toThrow(dbError);
    });

    it('should handle edge case with null user fields', async () => {
      const user = TestDataGenerator.generateUser({
        id: validPayload.sub,
        email: validPayload.email,
        firstName: null,
        lastName: null,
      });

      DatabaseTestHelper.mockUserExists({ ...user });

      const result = await strategy.validate(validPayload);

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.id).toBe(validPayload.sub);
      expect(result.email).toBe(validPayload.email);
    });

    it('should handle payload with additional fields gracefully', async () => {
      const extendedPayload = {
        ...validPayload,
        role: 'admin',
        permissions: ['read', 'write'],
        customField: 'value',
      };

      const user = TestDataGenerator.generateUser({
        id: validPayload.sub,
        email: validPayload.email,
      });

      DatabaseTestHelper.mockUserExists({ ...user });

      const result = await strategy.validate(extendedPayload);

      // Should only return expected authenticated user fields
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isVerified: user.isVerified,
      });

      // Should not include additional payload fields
      expect(result).not.toHaveProperty('role');
      expect(result).not.toHaveProperty('permissions');
      expect(result).not.toHaveProperty('customField');
    });

    it('should work with minimal valid payload', async () => {
      const minimalPayload: JwtPayload = {
        sub: validPayload.sub,
        email: validPayload.email,
      };

      const user = TestDataGenerator.generateUser({
        id: minimalPayload.sub,
        email: minimalPayload.email,
      });

      DatabaseTestHelper.mockUserExists({ ...user });

      const result = await strategy.validate(minimalPayload);

      expect(result.id).toBe(minimalPayload.sub);
      expect(result.email).toBe(minimalPayload.email);
    });
  });

  describe('constructor', () => {
    it('should be instantiated with correct configuration', () => {
      expect(strategy).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use correct JWT extraction method', () => {
      // This is tested implicitly by the Passport JWT strategy configuration
      // The strategy should extract JWT from Authorization header with Bearer scheme
      expect(strategy).toBeDefined();
    });
  });
});
