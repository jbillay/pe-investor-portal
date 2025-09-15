import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuthenticatedUser } from '../../src/auth/interfaces/auth.interface';
import * as bcrypt from 'bcrypt';

// Mock Prisma Service
export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  userProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

// Mock Redis Service

// Mock Config Service
export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
      BCRYPT_ROUNDS: '4',
      REDIS_URL: 'redis://localhost:6379',
      THROTTLE_TTL: '60000',
      THROTTLE_LIMIT: '10',
    };
    return config[key];
  }),
};

// Test data generators
export class TestDataGenerator {
  static generateUser(overrides: Partial<any> = {}) {
    return {
      id: 'user-test-id',
      email: 'test@example.com',
      password: '$2b$04$hash', // bcrypt hash for 'password123'
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }


  static generateSession(overrides: Partial<any> = {}) {
    return {
      id: 'session-test-id',
      userId: 'user-test-id',
      refreshToken: 'test-refresh-token',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: 'Test User Agent',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static generateAuthenticatedUser(
    overrides: Partial<AuthenticatedUser> = {},
  ): AuthenticatedUser {
    return {
      id: 'user-test-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      ...overrides,
    };
  }

  static generateJwtPayload(overrides: Partial<any> = {}) {
    return {
      sub: 'user-test-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      ...overrides,
    };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 4);
  }
}

// Common test module builder
export class TestModuleBuilder {
  static async createTestModule(providers: any[] = []): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        JwtService,
        ...providers,
      ],
    }).compile();
  }
}

// Custom matchers
export const customMatchers = {
  toBeValidJWT: (received: string) => {
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
    const pass = jwtRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },

  toBeValidCUID: (received: string) => {
    const cuidRegex = /^c[a-z0-9]{24}$/;
    const pass = cuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid CUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid CUID`,
        pass: false,
      };
    }
  },
};

// Request helpers
export class RequestHelper {
  static createMockRequest(overrides: Partial<any> = {}) {
    return {
      headers: {},
      get: jest.fn((header: string) => {
        const headers = {
          'user-agent': 'Test User Agent',
          ...overrides.headers,
        };
        return headers[header.toLowerCase()];
      }),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      user: null,
      ...overrides,
    };
  }
}

// Database test helpers
export class DatabaseTestHelper {
  static resetMocks() {
    Object.keys(mockPrismaService).forEach((model) => {
      Object.keys(mockPrismaService[model]).forEach((method) => {
        mockPrismaService[model][method].mockReset();
      });
    });

  }

  static mockUserExists(user: any) {
    // Mock findUnique with conditional logic based on query conditions
    mockPrismaService.user.findUnique.mockImplementation((query: any) => {
      const where = query?.where || {};

      // If querying with isActive: true and user is inactive, return null
      if (where.isActive === true && user.isActive === false) {
        return Promise.resolve(null);
      }

      // If querying by ID and ID matches, consider isActive condition
      if (where.id === user.id) {
        if (where.isActive === true && user.isActive === false) {
          return Promise.resolve(null);
        }
        return Promise.resolve(user);
      }

      // If querying by email
      if (where.email === user.email) {
        return Promise.resolve(user);
      }

      // Default case
      return Promise.resolve(user);
    });

    mockPrismaService.user.findFirst.mockResolvedValue(user);
  }

  static mockUserNotExists() {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.user.findFirst.mockResolvedValue(null);
  }


  static mockSessionExists(session: any) {
    mockPrismaService.session.findUnique.mockResolvedValue(session);
  }

  static mockSessionNotExists() {
    mockPrismaService.session.findUnique.mockResolvedValue(null);
  }
}

export default {
  TestDataGenerator,
  TestModuleBuilder,
  customMatchers,
  RequestHelper,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
};
