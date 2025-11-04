import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrismaService, createMockConfigService } from '../../../test/mocks';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const sessionData = {
      userId: 'user-1',
      refreshToken: 'refresh-token-123',
      expiresAt: new Date(Date.now() + 86400000),
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    };

    it('should create a new session', async () => {
      // Arrange
      prisma.session.create.mockResolvedValue({
        id: 'session-1',
        ...sessionData,
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.createSession(sessionData);

      // Assert
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: sessionData.userId,
          refreshToken: sessionData.refreshToken,
          expiresAt: sessionData.expiresAt,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
        },
      });
    });

    it('should throw error when session creation fails', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.session.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createSession(sessionData)).rejects.toThrow(error);
    });
  });

  describe('getSession', () => {
    const refreshToken = 'valid-refresh-token';

    it('should return session when found and not revoked', async () => {
      // Arrange
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: false,
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.session.findUnique.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession(refreshToken);

      // Assert
      expect(result).toEqual({
        userId: mockSession.userId,
        refreshToken: mockSession.refreshToken,
        expiresAt: mockSession.expiresAt,
        userAgent: mockSession.userAgent,
        ipAddress: mockSession.ipAddress,
      });
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: {
          refreshToken,
          isRevoked: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      });
    });

    it('should return null when session not found', async () => {
      // Arrange
      prisma.session.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getSession(refreshToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle sessions with null userAgent and ipAddress', async () => {
      // Arrange
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: false,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.session.findUnique.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession(refreshToken);

      // Assert
      expect(result).toEqual({
        userId: mockSession.userId,
        refreshToken: mockSession.refreshToken,
        expiresAt: mockSession.expiresAt,
        userAgent: undefined,
        ipAddress: undefined,
      });
    });
  });

  describe('revokeSession', () => {
    const refreshToken = 'refresh-token-123';

    it('should revoke a session', async () => {
      // Arrange
      prisma.session.update.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(),
        isRevoked: true,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.revokeSession(refreshToken);

      // Assert
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          refreshToken,
        },
        data: {
          isRevoked: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when revocation fails', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.session.update.mockRejectedValue(error);

      // Act & Assert
      await expect(service.revokeSession(refreshToken)).rejects.toThrow(error);
    });
  });

  describe('revokeAllUserSessions', () => {
    const userId = 'user-1';

    it('should revoke all user sessions', async () => {
      // Arrange
      prisma.session.updateMany.mockResolvedValue({ count: 3 });

      // Act
      await service.revokeAllUserSessions(userId);

      // Assert
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
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

    it('should throw error when revocation fails', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.session.updateMany.mockRejectedValue(error);

      // Act & Assert
      await expect(service.revokeAllUserSessions(userId)).rejects.toThrow(error);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired and revoked sessions', async () => {
      // Arrange
      prisma.session.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      await service.cleanupExpiredSessions();

      // Assert
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { isRevoked: true }],
        },
      });
    });
  });

  describe('updateSessionActivity', () => {
    const refreshToken = 'refresh-token-123';

    it('should update session with userAgent and ipAddress', async () => {
      // Arrange
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';
      prisma.session.update.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(),
        isRevoked: false,
        userAgent,
        ipAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.updateSessionActivity(refreshToken, userAgent, ipAddress);

      // Assert
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          refreshToken,
        },
        data: {
          updatedAt: expect.any(Date),
          userAgent,
          ipAddress,
        },
      });
    });

    it('should update session without optional parameters', async () => {
      // Arrange
      prisma.session.update.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(),
        isRevoked: false,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.updateSessionActivity(refreshToken);

      // Assert
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          refreshToken,
        },
        data: {
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.session.update.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateSessionActivity(refreshToken)).rejects.toThrow(
        error,
      );
    });
  });
});
