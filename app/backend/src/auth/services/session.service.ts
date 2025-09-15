import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionData } from '../interfaces/auth.interface';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createSession(sessionData: SessionData): Promise<void> {
    try {
      // Store session in database
      await this.prisma.session.create({
        data: {
          userId: sessionData.userId,
          refreshToken: sessionData.refreshToken,
          expiresAt: sessionData.expiresAt,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async getSession(refreshToken: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: {
        refreshToken,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
    };
  }

  async revokeSession(refreshToken: string): Promise<void> {
    try {
      // Mark as revoked in database
      await this.prisma.session.update({
        where: {
          refreshToken,
        },
        data: {
          isRevoked: true,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      // Mark all as revoked in database
      await this.prisma.session.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to revoke all user sessions:', error);
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Delete expired and revoked sessions from database
    await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
  }

  async updateSessionActivity(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await this.prisma.session.update({
        where: {
          refreshToken,
        },
        data: {
          updatedAt: new Date(),
          ...(userAgent && { userAgent }),
          ...(ipAddress && { ipAddress }),
        },
      });
    } catch (error) {
      console.error('Failed to update session activity:', error);
      throw error;
    }
  }
}
