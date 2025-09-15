import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { SessionService } from './session.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionData } from '../interfaces/auth.interface';
import {
  TestDataGenerator,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
} from '../../../test/utils/test-utils';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
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

    service = module.get<SessionService>(SessionService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    DatabaseTestHelper.resetMocks();
  });

  describe('createSession', () => {
    it('should create session in database', async () => {
      const sessionData: SessionData = {
        userId: 'user-test-id',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        userAgent: 'Test User Agent',
        ipAddress: '127.0.0.1',
      };

      const dbSession = TestDataGenerator.generateSession(sessionData);
      mockPrismaService.session.create.mockResolvedValue(dbSession);

      await service.createSession(sessionData);

      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: {
          userId: sessionData.userId,
          refreshToken: sessionData.refreshToken,
          expiresAt: sessionData.expiresAt,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const sessionData: SessionData = {
        userId: 'user-test-id',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: 'Test User Agent',
        ipAddress: '127.0.0.1',
      };
      const dbError = new Error('Database connection failed');
      mockPrismaService.session.create.mockRejectedValue(dbError);

      await expect(service.createSession(sessionData)).rejects.toThrow(dbError);
    });
  });

  describe('getSession', () => {
    it('should return session from database', async () => {
      const refreshToken = 'test-refresh-token';
      const mockSession = TestDataGenerator.generateSession({
        refreshToken,
        userId: 'user-test-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSession(refreshToken);

      expect(result).toEqual({
        userId: mockSession.userId,
        refreshToken: mockSession.refreshToken,
        expiresAt: mockSession.expiresAt,
        userAgent: mockSession.userAgent,
        ipAddress: mockSession.ipAddress,
      });

      expect(mockPrismaService.session.findUnique).toHaveBeenCalledWith({
        where: {
          refreshToken,
          isRevoked: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      });
    });

    it('should return null for non-existent session', async () => {
      const refreshToken = 'non-existent-token';
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      const result = await service.getSession(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null for revoked session', async () => {
      const refreshToken = 'revoked-token';
      mockPrismaService.session.findUnique.mockResolvedValue(null); // Query excludes revoked sessions

      const result = await service.getSession(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      const refreshToken = 'expired-token';
      mockPrismaService.session.findUnique.mockResolvedValue(null); // Query excludes expired sessions

      const result = await service.getSession(refreshToken);

      expect(result).toBeNull();
    });
  });

  describe('revokeSession', () => {
    it('should revoke session in database', async () => {
      const refreshToken = 'test-refresh-token';
      const mockSession = TestDataGenerator.generateSession({ refreshToken });
      mockPrismaService.session.update.mockResolvedValue(mockSession);

      await service.revokeSession(refreshToken);

      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { refreshToken },
        data: {
          isRevoked: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle database update errors gracefully', async () => {
      const refreshToken = 'test-refresh-token';
      const dbError = new Error('Database update failed');
      mockPrismaService.session.update.mockRejectedValue(dbError);

      await expect(service.revokeSession(refreshToken)).rejects.toThrow(dbError);
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all user sessions in database', async () => {
      const userId = 'user-test-id';
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 2 });

      await service.revokeAllUserSessions(userId);

      expect(mockPrismaService.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle no active sessions gracefully', async () => {
      const userId = 'user-test-id';
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.revokeAllUserSessions(userId)).resolves.toBeUndefined();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired and revoked sessions', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredSessions();

      expect(mockPrismaService.session.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { isRevoked: true }],
        },
      });
    });

    it('should handle cleanup with no expired sessions', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.cleanupExpiredSessions()).resolves.toBeUndefined();
    });
  });

  describe('updateSessionActivity', () => {
    const refreshToken = 'test-refresh-token';
    const userAgent = 'Updated User Agent';
    const ipAddress = '192.168.1.1';

    it('should update session activity in database', async () => {
      mockPrismaService.session.update.mockResolvedValue(
        TestDataGenerator.generateSession({ refreshToken }),
      );

      await service.updateSessionActivity(refreshToken, userAgent, ipAddress);

      // Verify database update
      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { refreshToken },
        data: {
          updatedAt: expect.any(Date),
          userAgent,
          ipAddress,
        },
      });
    });

    it('should handle partial updates', async () => {
      mockPrismaService.session.update.mockResolvedValue(
        TestDataGenerator.generateSession({ refreshToken }),
      );

      await service.updateSessionActivity(refreshToken, userAgent);

      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { refreshToken },
        data: {
          updatedAt: expect.any(Date),
          userAgent,
        },
      });
    });

    it('should handle database errors during activity update', async () => {
      const dbError = new Error('Database update failed');
      mockPrismaService.session.update.mockRejectedValue(dbError);

      await expect(
        service.updateSessionActivity(refreshToken, userAgent, ipAddress),
      ).rejects.toThrow(dbError);
    });
  });
});