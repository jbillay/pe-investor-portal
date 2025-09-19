import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { AuthResponseDto } from '../../auth/dto/auth.dto';

export class TestDataGenerator {
  static generateAuthenticatedUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      ...overrides,
    };
  }

  static generateAuthResponse(overrides?: Partial<AuthResponseDto>): AuthResponseDto {
    return {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      expiresIn: 900,
      ...overrides,
    };
  }

  static generateInvestment(overrides?: any) {
    return {
      id: 'investment-123',
      userId: 'user-123',
      fundId: 'fund-123',
      commitmentAmount: 1000000,
      drawnAmount: 250000,
      distributedAmount: 50000,
      currentValue: 1200000,
      irr: 0.125,
      multiple: 1.2,
      status: 'ACTIVE',
      investmentDate: new Date('2024-01-15'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      fund: {
        id: 'fund-123',
        name: 'Test Fund',
        fundType: 'PE',
        vintage: 2024,
        currency: 'USD',
        status: 'ACTIVE',
      },
      ...overrides,
    };
  }

  static generateFund(overrides?: any) {
    return {
      id: 'fund-123',
      name: 'Test Fund',
      description: 'A test fund for PE investments',
      fundType: 'PE',
      vintage: 2024,
      targetSize: 100000000,
      commitedSize: 85000000,
      drawnSize: 25000000,
      currency: 'USD',
      status: 'ACTIVE',
      closeDate: new Date('2024-01-15'),
      finalClose: new Date('2024-06-15'),
      liquidationDate: new Date('2034-01-15'),
      managementFee: 0.02,
      carriedInterest: 0.20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static generateCapitalCall(overrides?: any) {
    return {
      id: 'call-123',
      fundId: 'fund-123',
      callNumber: 1,
      callDate: new Date('2024-01-15'),
      dueDate: new Date('2024-01-30'),
      totalAmount: 5000000,
      purpose: 'Investment deployment',
      status: 'PENDING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static generateDistribution(overrides?: any) {
    return {
      id: 'dist-123',
      fundId: 'fund-123',
      distributionNumber: 1,
      recordDate: new Date('2024-02-01'),
      paymentDate: new Date('2024-02-15'),
      totalAmount: 2000000,
      distributionType: 'DIVIDEND',
      status: 'PAID',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static generateDocument(overrides?: any) {
    return {
      id: 'doc-123',
      fundId: 'fund-123',
      title: 'Fund Agreement',
      description: 'Primary fund agreement document',
      category: 'LEGAL',
      fileName: 'fund-agreement.pdf',
      fileSize: 2048000,
      mimeType: 'application/pdf',
      uploadDate: new Date(),
      version: '1.0',
      isConfidential: true,
      isActive: true,
      uploadedBy: 'admin-123',
      ...overrides,
    };
  }

  static generatePrismaDecimal(value: number) {
    return {
      toNumber: () => value,
      toString: () => value.toString(),
      valueOf: () => value,
    };
  }
}

export class RequestHelper {
  static createMockRequest(options: any = {}) {
    const defaultOptions = {
      headers: {
        'user-agent': 'Test User Agent',
        ...options.headers,
      },
      connection: {
        remoteAddress: '127.0.0.1',
        ...options.connection,
      },
      socket: {
        remoteAddress: '127.0.0.1',
        ...options.socket,
      },
      ...options,
    };

    const mockRequest = {
      ...defaultOptions,
      get: jest.fn().mockImplementation((headerName: string) => {
        return defaultOptions.headers[headerName.toLowerCase()];
      }),
    };

    return mockRequest;
  }

  static createMockResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  }
}

export class PrismaTestHelper {
  static createMockPrismaService() {
    return {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      investment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
      fund: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
      capitalCall: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      distribution: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      document: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      valuation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  static resetAllMocks(prismaService: any) {
    Object.keys(prismaService).forEach(model => {
      if (typeof prismaService[model] === 'object' && prismaService[model] !== null) {
        Object.keys(prismaService[model]).forEach(method => {
          if (jest.isMockFunction(prismaService[model][method])) {
            prismaService[model][method].mockReset();
          }
        });
      }
    });
  }
}

export class ValidationHelper {
  static generateValidEmail(): string {
    return `test${Date.now()}@example.com`;
  }

  static generateValidPassword(): string {
    return 'Password123!';
  }

  static generateInvalidEmail(): string {
    return 'invalid-email';
  }

  static generateWeakPassword(): string {
    return '123';
  }

  static generateValidUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export class DateHelper {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  static isPast(date: Date): boolean {
    return date < new Date();
  }
}

export class ErrorHelper {
  static expectValidationError(fn: () => Promise<any>, expectedMessage?: string) {
    return async () => {
      try {
        await fn();
        throw new Error('Expected validation error but none was thrown');
      } catch (error: any) {
        if (expectedMessage) {
          expect(error.message).toContain(expectedMessage);
        }
        expect(error).toBeDefined();
      }
    };
  }

  static expectUnauthorizedError(fn: () => Promise<any>) {
    return async () => {
      try {
        await fn();
        throw new Error('Expected unauthorized error but none was thrown');
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    };
  }

  static expectNotFoundError(fn: () => Promise<any>) {
    return async () => {
      try {
        await fn();
        throw new Error('Expected not found error but none was thrown');
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    };
  }
}