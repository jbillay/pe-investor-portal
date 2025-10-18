import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  GoneException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import * as bcrypt from 'bcrypt';
import {
  validateNewPassword,
  validatePasswordMatch,
} from '../../common/utils/password-validator.util';
import { isTempPasswordExpired } from '../../common/utils/password-generator.util';
import {
  PASSWORD_ERROR_MESSAGES,
  PASSWORD_AUDIT_ACTIONS,
  PASSWORD_HASHING,
} from '../../common/constants/password.constants';
import { SetPasswordDto, SetPasswordResponseDto } from '../dto/set-password.dto';

/**
 * Password Service
 * Handles password-related operations including setting permanent passwords
 * after temp password login
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  /**
   * Set permanent password for user with temporary password
   * @param userId - User ID from JWT token
   * @param setPasswordDto - Password data
   * @returns New tokens and user info
   */
  async setPassword(
    userId: string,
    setPasswordDto: SetPasswordDto,
  ): Promise<SetPasswordResponseDto> {
    try {
      // Get user with temporary password status
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has temporary password
      if (!user.isTempPassword) {
        throw new BadRequestException('User does not have a temporary password');
      }

      // Check if temporary password has expired
      if (isTempPasswordExpired(user.tempPasswordExpiresAt)) {
        this.logger.warn(`Expired temp password attempt for user: ${user.email}`);

        await this.auditLogger.logEvent({
          action: PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
          userId,
          resource: 'auth',
          details: { reason: 'Temp password expired', targetUserId: userId },
        });

        throw new GoneException(PASSWORD_ERROR_MESSAGES.TEMP_PASSWORD_EXPIRED);
      }

      // Verify the temporary password
      const isTempPasswordValid = await bcrypt.compare(
        setPasswordDto.tempPassword,
        user.password,
      );

      if (!isTempPasswordValid) {
        this.logger.warn(`Invalid temp password attempt for user: ${user.email}`);

        await this.auditLogger.logEvent({
          action: PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
          userId,
          resource: 'auth',
          details: { reason: 'Invalid temp password', targetUserId: userId },
        });

        throw new UnauthorizedException(PASSWORD_ERROR_MESSAGES.INVALID_TEMP_PASSWORD);
      }

      // Validate new password
      const validation = validateNewPassword(
        setPasswordDto.newPassword,
        setPasswordDto.confirmPassword,
        user.email,
        setPasswordDto.tempPassword,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Password validation failed for user: ${user.email} - ${validation.errors.join(', ')}`,
        );

        await this.auditLogger.logEvent({
          action: PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
          userId,
          resource: 'auth',
          details: { errors: validation.errors, targetUserId: userId },
        });

        throw new BadRequestException({
          message: 'Password validation failed',
          errors: validation.errors,
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        setPasswordDto.newPassword,
        PASSWORD_HASHING.SALT_ROUNDS,
      );

      // Update user with new password
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isTempPassword: false,
          tempPasswordExpiresAt: null,
          passwordSetAt: new Date(),
          isVerified: true, // Mark as verified when they set password
          updatedAt: new Date(),
        },
      });

      // Revoke all existing sessions (force new login with new password)
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      // Generate new JWT tokens
      const roles = user.userRoles.map((ur) => ur.role.name);
      const payload = {
        sub: user.id,
        email: user.email,
        roles,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('jwt.accessTokenExpiry', '15m'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('jwt.refreshTokenExpiry', '7d'),
      });

      // Create new session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
          isRevoked: false,
        },
      });

      // Log audit event
      await this.auditLogger.logEvent({
        action: PASSWORD_AUDIT_ACTIONS.PASSWORD_SET,
        userId,
        resource: 'auth',
        details: { email: user.email, targetUserId: userId },
      });

      this.logger.log(`Password set successfully for user: ${user.email}`);

      return {
        message: 'Password set successfully',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          roles,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof GoneException
      ) {
        throw error;
      }

      this.logger.error(
        `Error in setPassword: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to set password');
    }
  }
}
