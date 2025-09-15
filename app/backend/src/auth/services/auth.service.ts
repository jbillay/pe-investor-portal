import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionService } from './session.service';
import { LoginDto, RegisterDto, AuthResponseDto } from '../dto/auth.dto';
import {
  JwtPayload,
  JwtTokens,
  AuthenticatedUser,
} from '../interfaces/auth.interface';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
  ) {}

  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '12'),
    );
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Create user profile
    await this.prisma.userProfile.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    // Create session
    const refreshExpirationDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    // Log audit event
    await this.logAuditEvent(
      'REGISTER',
      user.id,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      expiresIn: this.getAccessTokenExpirationTime(),
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    // Create session
    const refreshExpirationDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    // Log audit event
    await this.logAuditEvent(
      'LOGIN',
      user.id,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      expiresIn: this.getAccessTokenExpirationTime(),
    };
  }

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    // Get session data
    const sessionData = await this.sessionService.getSession(refreshToken);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: {
        id: sessionData.userId,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old session
    await this.sessionService.revokeSession(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    // Create new session
    const refreshExpirationDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    await this.sessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    // Log audit event
    await this.logAuditEvent(
      'TOKEN_REFRESH',
      user.id,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      expiresIn: this.getAccessTokenExpirationTime(),
    };
  }

  async logout(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const sessionData = await this.sessionService.getSession(refreshToken);

    await this.sessionService.revokeSession(refreshToken);

    if (sessionData) {
      // Log audit event
      await this.logAuditEvent(
        'LOGOUT',
        sessionData.userId,
        ipAddress,
        userAgent,
      );
    }
  }

  async logoutAll(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.sessionService.revokeAllUserSessions(userId);

    if (user) {
      // Log audit event
      await this.logAuditEvent(
        'LOGOUT_ALL',
        userId,
        ipAddress,
        userAgent,
      );
    }
  }

  async validateUser(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        isActive: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<JwtTokens> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const refreshTokenPayload = {
      sub: payload.sub,
      type: 'refresh',
      jti: randomBytes(16).toString('hex'), // Unique identifier for the refresh token
    };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private getAccessTokenExpirationTime(): number {
    const expiration = this.configService.get<string>('JWT_EXPIRATION', '15m');
    if (expiration.endsWith('m')) {
      return parseInt(expiration) * 60; // Convert minutes to seconds
    }
    if (expiration.endsWith('h')) {
      return parseInt(expiration) * 60 * 60; // Convert hours to seconds
    }
    if (expiration.endsWith('d')) {
      return parseInt(expiration) * 24 * 60 * 60; // Convert days to seconds
    }
    return 900; // Default 15 minutes
  }

  private async logAuditEvent(
    action: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress,
          userAgent,
          ...(details && { details }),
        },
      });
    } catch (error) {
      // Log audit errors but don't fail the main operation
      console.error('Failed to log audit event:', error);
    }
  }
}
