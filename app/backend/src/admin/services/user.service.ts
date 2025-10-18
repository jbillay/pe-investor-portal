import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { plainToClass } from 'class-transformer';

import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserVerificationDto,
  ResetPasswordDto,
  QueryUsersDto,
  UserStatsQueryDto,
  AssignRolesDto,
  RevokeRolesDto,
  BulkRoleOperationDto,
  QueryUserRolesDto,
  UserResponseDto,
  DetailedUserResponseDto,
  PaginatedUsersResponseDto,
  UserCreatedResponseDto,
  BulkOperationResponseDto,
  UserStatsResponseDto,
  UserSortField,
  SortOrder,
  UserStatus
} from '../dto';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import { CreateUserResponseDto } from '../dto/create-user-response.dto';
import { EmailService } from '../../email/services/email.service';
import {
  generateTempPassword,
  getTempPasswordExpiration,
} from '../../common/utils/password-generator.util';
import { PASSWORD_AUDIT_ACTIONS } from '../../common/constants/password.constants';

/**
 * User Service
 *
 * Provides comprehensive business logic for user management operations
 * including CRUD operations, role management, bulk operations, and analytics.
 *
 * Features:
 * - Secure password handling with bcrypt
 * - Email verification workflow
 * - Role-based access control integration
 * - Advanced querying and filtering
 * - Bulk operations with transaction support
 * - Comprehensive audit logging
 * - Event-driven notifications
 * - Data export capabilities
 * - Statistics and analytics
 *
 * @author Backend Team
 * @version 1.0.0
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds: number;
  private readonly maxUsersPerBulkOperation: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLogger: AuditLoggerService,
    private readonly emailService: EmailService
  ) {
    this.saltRounds = this.config.get<number>('auth.saltRounds', 12);
    this.maxUsersPerBulkOperation = this.config.get<number>('user.maxBulkOperationSize', 100);
  }

  /**
   * Get paginated list of users with advanced filtering and sorting
   */
  async findAll(
    query: QueryUsersDto,
    requestingUserId: string
  ): Promise<PaginatedUsersResponseDto> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        isVerified,
        roles,
        language,
        timezone,
        createdAfter,
        createdBefore,
        lastLoginAfter,
        lastLoginBefore,
        includeNeverLoggedIn = true,
        sortBy = UserSortField.CREATED_AT,
        sortOrder = SortOrder.DESC,
        includeProfile = false,
        includeRoles = true,
        includeStats = false
      } = query;

      // Build where clause
      const where: any = {
        // Only include active users by default
        isActive: true
      };

      // Search filter
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Status filter
      if (status) {
        switch (status) {
          case UserStatus.ACTIVE:
            where.isActive = true;
            where.isVerified = true;
            break;
          case UserStatus.INACTIVE:
            where.isActive = false;
            break;
          case UserStatus.PENDING:
            where.isActive = true;
            where.isVerified = false;
            break;
          case UserStatus.SUSPENDED:
            // Custom logic for suspended users
            where.suspendedAt = { not: null };
            break;
        }
      }

      // Verification filter
      if (typeof isVerified === 'boolean') {
        where.isVerified = isVerified;
      }

      // Role filter
      if (roles && roles.length > 0) {
        where.userRoles = {
          some: {
            isActive: true,
            role: {
              name: { in: roles }
            }
          }
        };
      }

      // Profile filters
      if (language || timezone) {
        where.profile = {};
        if (language) where.profile.language = language;
        if (timezone) where.profile.timezone = timezone;
      }

      // Date range filters
      if (createdAfter || createdBefore) {
        where.createdAt = {};
        if (createdAfter) where.createdAt.gte = new Date(createdAfter);
        if (createdBefore) where.createdAt.lte = new Date(createdBefore);
      }

      // Last login filters
      if (lastLoginAfter || lastLoginBefore || !includeNeverLoggedIn) {
        where.lastLogin = {};
        if (lastLoginAfter) where.lastLogin.gte = new Date(lastLoginAfter);
        if (lastLoginBefore) where.lastLogin.lte = new Date(lastLoginBefore);
        if (!includeNeverLoggedIn) where.lastLogin.not = null;
      }

      // Build include clause
      const include: any = {};
      if (includeProfile) {
        include.profile = true;
      }
      if (includeRoles) {
        include.userRoles = {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with total count
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        this.prisma.user.count({ where })
      ]);

      // Transform users to response DTOs
      const userData = await Promise.all(
        users.map(async (user: any) => {
          const baseUser = plainToClass(UserResponseDto, user, {
            excludeExtraneousValues: true
          });

          if (includeStats) {
            // Add user statistics
            const stats = await this.getUserStats(user.id);
            (baseUser as any).stats = stats;
          }

          return baseUser;
        })
      );

      const totalPages = Math.ceil(total / limit);

      // Log access for audit
      await this.auditLogger.logUserEvent(
        'USER_VIEWED',
        requestingUserId,
        undefined,
        undefined,
        undefined,
        { action: 'USER_LIST_ACCESSED', filters: query, resultCount: users.length }
      );

      this.eventEmitter.emit('user.list.accessed', {
        requestingUserId,
        filters: query,
        resultCount: users.length,
        timestamp: new Date()
      });

      return {
        data: userData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          search,
          status,
          roles,
          isVerified,
          createdAfter,
          createdBefore
        },
        sorting: {
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      this.logger.error(`Error in findAll: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  /**
   * Get detailed information about a specific user
   */
  async findOne(id: string, requestingUserId: string): Promise<DetailedUserResponseDto> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          isActive: true
        },
        include: {
          profile: true,
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if requesting user can access this user's details
      await this.validateUserAccess(requestingUserId, id, 'read');

      // Transform to response DTO
      const userResponse = plainToClass(DetailedUserResponseDto, user, {
        excludeExtraneousValues: true
      });

      // Add user statistics
      userResponse.stats = await this.getUserStats(id);

      // Log access for audit
      await this.auditLogger.logUserEvent(
        'USER_VIEWED',
        requestingUserId,
        id,
        undefined,
        undefined,
        { action: 'USER_DETAILS_ACCESSED' }
      );

      this.eventEmitter.emit('user.details.accessed', {
        requestingUserId,
        targetUserId: id,
        timestamp: new Date()
      });

      return userResponse;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error in findOne: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  /**
   * Create a new user account
   */
  async create(
    createUserDto: CreateUserDto,
    createdById: string
  ): Promise<UserCreatedResponseDto> {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, this.saltRounds);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Start transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: createUserDto.email,
            password: hashedPassword,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            isActive: createUserDto.isActive ?? false,
            isVerified: createUserDto.isVerified ?? false
          }
        });

        // Create user profile
        await tx.userProfile.create({
          data: {
            userId: user.id,
            phone: createUserDto.phone,
            timezone: createUserDto.timezone ?? 'UTC',
            language: createUserDto.language ?? 'en',
            preferences: createUserDto.preferences ?? {}
          }
        });

        // Assign initial roles
        if (createUserDto.roles && createUserDto.roles.length > 0) {
          const roles = await tx.role.findMany({
            where: {
              name: { in: createUserDto.roles },
              isActive: true
            }
          });

          for (const role of roles) {
            await tx.userRole.create({
              data: {
                userId: user.id,
                roleId: role.id,
                isActive: true
              }
            });

            await tx.roleAssignment.create({
              data: {
                userId: user.id,
                roleId: role.id,
                assignedBy: createdById,
                reason: createUserDto.reason ?? 'Initial role assignment',
                isActive: true
              }
            });
          }
        } else {
          // Assign default role
          const defaultRole = await tx.role.findFirst({
            where: { isDefault: true, isActive: true }
          });

          if (defaultRole) {
            await tx.userRole.create({
              data: {
                userId: user.id,
                roleId: defaultRole.id,
                isActive: true
              }
            });

            await tx.roleAssignment.create({
              data: {
                userId: user.id,
                roleId: defaultRole.id,
                assignedBy: createdById,
                reason: 'Default role assignment',
                isActive: true
              }
            });
          }
        }

        return user;
      });

      // Transform response
      const response = plainToClass(UserCreatedResponseDto, result, {
        excludeExtraneousValues: true
      });

      response.emailVerificationToken = emailVerificationToken;

      // Log audit event
      await this.auditLogger.logUserEvent(
        'USER_CREATED',
        createdById,
        result.id,
        undefined,
        undefined,
        { email: result.email, roles: createUserDto.roles }
      );

      // Emit events for notifications
      this.eventEmitter.emit('user.created', {
        user: response,
        createdBy: createdById,
        emailVerificationToken,
        timestamp: new Date()
      });

      this.logger.log(`User created successfully: ${result.email} by ${createdById}`);

      return response;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Error in create: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Create a new user account with temporary password (Admin flow)
   * Generates secure temporary password and sends welcome email
   */
  async createUserWithTempPassword(
    createUserAdminDto: CreateUserAdminDto,
    createdById: string
  ): Promise<CreateUserResponseDto> {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserAdminDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();
      const tempPasswordExpiresAt = getTempPasswordExpiration();

      // Hash temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltRounds);

      // Start transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Create user with temp password
        const user = await tx.user.create({
          data: {
            email: createUserAdminDto.email,
            password: hashedPassword,
            firstName: createUserAdminDto.firstName,
            lastName: createUserAdminDto.lastName,
            isActive: true, // Immediately active
            isVerified: false, // Not verified until they set password
            isTempPassword: true, // Flag for temp password
            tempPasswordExpiresAt,
          }
        });

        // Create user profile
        await tx.userProfile.create({
          data: {
            userId: user.id,
            timezone: createUserAdminDto.timezone ?? 'UTC',
            language: 'en', // Default to English as per requirements
            preferences: {}
          }
        });

        // Assign default roles
        const defaultRoles = await tx.role.findMany({
          where: { isDefault: true, isActive: true }
        });

        const assignedRoles: string[] = [];

        for (const role of defaultRoles) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              isActive: true
            }
          });

          await tx.roleAssignment.create({
            data: {
              userId: user.id,
              roleId: role.id,
              assignedBy: createdById,
              reason: 'Default role assignment for new user',
              isActive: true
            }
          });

          assignedRoles.push(role.name);
        }

        return { user, assignedRoles };
      });

      // Get user profile
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId: result.user.id }
      });

      // Send welcome email with temporary password
      let emailSent = false;
      let emailError: string | undefined;

      try {
        const loginUrl = this.config.get<string>('app.frontendUrl', 'http://localhost:3000') + '/login';
        const supportEmail = this.config.get<string>('email.supportEmail', 'support@pe-portal.com');
        const portalName = this.config.get<string>('app.name', 'PE Investor Portal');

        await this.emailService.sendTemplatedEmail({
          templateName: 'USER_ACCOUNT_CREATED',
          recipientEmail: result.user.email,
          recipientName: `${result.user.firstName} ${result.user.lastName}`,
          variables: {
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            email: result.user.email,
            platformName: portalName,
            loginUrl,
            tempPassword, // Temporary password (shown only once in email)
            expiresAt: tempPasswordExpiresAt.toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }),
            supportEmail,
          }
        });

        emailSent = true;
        this.logger.log(`Welcome email sent successfully to: ${result.user.email}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send welcome email: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        emailError = errorMessage;
        // Don't throw - user is created, just email failed
      }

      // Log audit event
      await this.auditLogger.logUserEvent(
        'USER_CREATED',
        createdById,
        result.user.id,
        undefined,
        undefined,
        {
          email: result.user.email,
          roles: result.assignedRoles,
          tempPasswordGenerated: true,
          tempPasswordExpiresAt: tempPasswordExpiresAt.toISOString(),
          emailSent
        }
      );

      // Emit event
      this.eventEmitter.emit('user.created.with.temp.password', {
        userId: result.user.id,
        email: result.user.email,
        createdBy: createdById,
        tempPasswordExpiresAt,
        emailSent,
        timestamp: new Date()
      });

      this.logger.log(`User created successfully with temp password: ${result.user.email} by ${createdById}`);

      // Return response (temp password only returned here, never stored!)
      return {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName!,
        lastName: result.user.lastName!,
        tempPassword, // IMPORTANT: Only returned once!
        tempPasswordExpiresAt,
        roles: result.assignedRoles,
        timezone: userProfile?.timezone ?? 'UTC',
        emailSent,
        emailError,
        createdAt: result.user.createdAt
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Error in createUserWithTempPassword: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Update user information
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedById: string
  ): Promise<DetailedUserResponseDto> {
    try {
      // Validate user access
      await this.validateUserAccess(updatedById, id, 'update');

      // Check if email is being changed and if it's unique
      if (updateUserDto.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            id: { not: id }
          }
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      // Start transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Update user
        const user = await tx.user.update({
          where: { id },
          data: {
            email: updateUserDto.email,
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName
          },
          include: {
            profile: true,
            userRoles: {
              where: { isActive: true },
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          }
        });

        // Update profile if provided
        if (updateUserDto.phone !== undefined ||
            updateUserDto.timezone !== undefined ||
            updateUserDto.language !== undefined ||
            updateUserDto.preferences !== undefined) {
          await tx.userProfile.update({
            where: { userId: id },
            data: {
              phone: updateUserDto.phone,
              timezone: updateUserDto.timezone,
              language: updateUserDto.language,
              preferences: updateUserDto.preferences
            }
          });
        }

        return user;
      });

      // Transform response
      const response = plainToClass(DetailedUserResponseDto, result, {
        excludeExtraneousValues: true
      });

      response.stats = await this.getUserStats(id);

      // Log audit event
      await this.auditLogger.logUserEvent(
        'USER_UPDATED',
        updatedById,
        id,
        undefined,
        undefined,
        { changes: updateUserDto, reason: updateUserDto.reason }
      );

      // Emit event
      this.eventEmitter.emit('user.updated', {
        userId: id,
        updatedBy: updatedById,
        changes: updateUserDto,
        reason: updateUserDto.reason,
        timestamp: new Date()
      });

      this.logger.log(`User updated successfully: ${id} by ${updatedById}`);

      return response;
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof ConflictException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error in update: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateUserStatusDto,
    updatedById: string
  ): Promise<UserResponseDto> {
    try {
      // Prevent self-deactivation
      if (id === updatedById && !updateStatusDto.isActive) {
        throw new BadRequestException('Cannot deactivate your own account');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: updateStatusDto.isActive,
          updatedAt: new Date()
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // If deactivating, revoke all active sessions
      if (!updateStatusDto.isActive) {
        await this.prisma.session.updateMany({
          where: { userId: id },
          data: { isRevoked: true }
        });
      }

      const response = plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true
      });

      // Emit event
      this.eventEmitter.emit('user.status.changed', {
        userId: id,
        newStatus: updateStatusDto.isActive,
        updatedBy: updatedById,
        reason: updateStatusDto.reason,
        timestamp: new Date()
      });

      this.logger.log(`User status updated: ${id} -> ${updateStatusDto.isActive} by ${updatedById}`);

      return response;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error in updateStatus: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to update user status');
    }
  }

  /**
   * Update user email verification status
   */
  async updateVerification(
    id: string,
    updateVerificationDto: UpdateUserVerificationDto,
    updatedById: string
  ): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isVerified: updateVerificationDto.isVerified,
          updatedAt: new Date()
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const response = plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true
      });

      // Emit event
      this.eventEmitter.emit('user.verification.changed', {
        userId: id,
        isVerified: updateVerificationDto.isVerified,
        updatedBy: updatedById,
        reason: updateVerificationDto.reason,
        timestamp: new Date()
      });

      this.logger.log(`User verification updated: ${id} -> ${updateVerificationDto.isVerified} by ${updatedById}`);

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error in updateVerification: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to update user verification');
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(
    id: string,
    resetPasswordDto: ResetPasswordDto,
    resetById: string
  ): Promise<{ message: string; temporaryPassword?: string }> {
    try {
      // Prevent self password reset through admin endpoint
      if (id === resetById) {
        throw new BadRequestException('Cannot reset your own password through this endpoint');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(resetPasswordDto.temporaryPassword, this.saltRounds);

      // Update user password and force change
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Revoke all active sessions
      await this.prisma.session.updateMany({
        where: { userId: id },
        data: { isRevoked: true }
      });

      // Emit event
      this.eventEmitter.emit('user.password.reset', {
        userId: id,
        resetBy: resetById,
        reason: resetPasswordDto.reason,
        forceChange: resetPasswordDto.forcePasswordChange,
        timestamp: new Date()
      });

      this.logger.log(`Password reset for user: ${id} by ${resetById}`);

      return {
        message: 'Password reset successfully',
        temporaryPassword: resetPasswordDto.temporaryPassword
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error in resetPassword: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(query: UserStatsQueryDto): Promise<UserStatsResponseDto> {
    try {
      const { startDate, endDate, groupBy = 'month' } = query;

      // Build date range filter
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Aggregate queries
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersLast30Days,
        activeUsersLast30Days,
        usersByRole,
        geographicDistribution
      ] = await Promise.all([
        // Total users
        this.prisma.user.count({
          where: { isActive: true }
        }),

        // Active users
        this.prisma.user.count({
          where: { isActive: true }
        }),

        // Verified users
        this.prisma.user.count({
          where: { isVerified: true, isActive: true }
        }),

        // New users in last 30 days
        this.prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isActive: true
          }
        }),

        // Active users in last 30 days
        this.prisma.user.count({
          where: {
            lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isActive: true
          }
        }),

        // Users by role
        this.prisma.role.findMany({
          include: {
            userRoles: {
              where: { isActive: true },
              select: { userId: true }
            }
          }
        }),

        // Geographic distribution
        this.prisma.userProfile.groupBy({
          by: ['timezone'],
          _count: true,
          orderBy: { _count: { timezone: 'desc' } }
        })
      ]);

      // Process users by role
      const roleStats = usersByRole.map((role: any) => ({
        roleName: role.name,
        count: role.userRoles.length,
        percentage: totalUsers > 0 ? (role.userRoles.length / totalUsers) * 100 : 0
      }));

      // Process geographic distribution
      const geoStats = geographicDistribution.map((geo: any) => ({
        timezone: geo.timezone,
        count: geo._count,
        percentage: totalUsers > 0 ? (geo._count / totalUsers) * 100 : 0
      }));

      // Generate growth statistics (simplified example)
      const growthStats = await this.generateGrowthStats(groupBy, dateFilter);

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersLast30Days,
        activeUsersLast30Days,
        usersByRole: roleStats,
        growthStats,
        geographicDistribution: geoStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error in getStatistics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to generate statistics');
    }
  }

  /**
   * Get user roles and assignments
   */
  async getUserRoles(id: string, query: QueryUserRolesDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          userRoles: {
            where: query.activeOnly ? { isActive: true } : {},
            include: {
              role: {
                include: {
                  rolePermissions: query.includePermissions
                    ? {
                        include: { permission: true }
                      }
                    : false
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user.userRoles;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error in getUserRoles: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to get user roles');
    }
  }

  /**
   * Assign roles to a user
   */
  async assignRoles(
    id: string,
    assignRolesDto: AssignRolesDto,
    assignedById: string
  ) {
    try {
      // Validate roles exist
      const roles = await this.prisma.role.findMany({
        where: {
          name: { in: assignRolesDto.roles },
          isActive: true
        }
      });

      if (roles.length !== assignRolesDto.roles.length) {
        const foundRoles = roles.map((r: any) => r.name);
        const missingRoles = assignRolesDto.roles.filter(r => !foundRoles.includes(r));
        throw new BadRequestException(`Invalid roles: ${missingRoles.join(', ')}`);
      }

      // Start transaction
      await this.prisma.$transaction(async (tx: any) => {
        for (const role of roles) {
          // Check if role already assigned and active
          const existingAssignment = await tx.userRole.findFirst({
            where: {
              userId: id,
              roleId: role.id,
              isActive: true
            }
          });

          if (!existingAssignment) {
            // Use upsert to handle potential unique constraint violations
            await tx.userRole.upsert({
              where: {
                userId_roleId: {
                  userId: id,
                  roleId: role.id
                }
              },
              update: {
                isActive: true,
                updatedAt: new Date()
              },
              create: {
                userId: id,
                roleId: role.id,
                isActive: true
              }
            });

            // Create role assignment record
            await tx.roleAssignment.create({
              data: {
                userId: id,
                roleId: role.id,
                assignedBy: assignedById,
                reason: assignRolesDto.reason,
                expiresAt: assignRolesDto.expiresAt ? new Date(assignRolesDto.expiresAt) : null,
                isActive: true
              }
            });
          }
        }
      });

      // Log audit event
      await this.auditLogger.logUserEvent(
        'ROLE_ASSIGNED',
        assignedById,
        id,
        undefined,
        undefined,
        { roles: assignRolesDto.roles, reason: assignRolesDto.reason }
      );

      // Emit event
      this.eventEmitter.emit('user.roles.assigned', {
        userId: id,
        roles: assignRolesDto.roles,
        assignedBy: assignedById,
        reason: assignRolesDto.reason,
        timestamp: new Date()
      });

      this.logger.log(`Roles assigned to user ${id}: ${assignRolesDto.roles.join(', ')} by ${assignedById}`);

      return { message: 'Roles assigned successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error in assignRoles: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to assign roles');
    }
  }

  /**
   * Revoke roles from a user
   */
  async revokeRoles(
    id: string,
    revokeRolesDto: RevokeRolesDto,
    revokedById: string
  ) {
    try {
      // Check user has roles to revoke
      const userRoles = await this.prisma.userRole.findMany({
        where: {
          userId: id,
          isActive: true,
          role: {
            name: { in: revokeRolesDto.roles }
          }
        },
        include: { role: true }
      });

      if (userRoles.length === 0) {
        throw new BadRequestException('User does not have specified roles');
      }

      // Ensure user will have at least one role remaining
      const remainingRoles = await this.prisma.userRole.count({
        where: {
          userId: id,
          isActive: true,
          role: {
            name: { notIn: revokeRolesDto.roles }
          }
        }
      });

      if (remainingRoles === 0) {
        throw new BadRequestException('Cannot revoke all roles - user must have at least one role');
      }

      // Start transaction
      await this.prisma.$transaction(async (tx: any) => {
        for (const userRole of userRoles) {
          // Deactivate user role
          await tx.userRole.update({
            where: { id: userRole.id },
            data: { isActive: false }
          });

          // Update role assignment record
          await tx.roleAssignment.updateMany({
            where: {
              userId: id,
              roleId: userRole.roleId,
              isActive: true
            },
            data: {
              revokedAt: new Date(),
              revokedBy: revokedById,
              revokeReason: revokeRolesDto.reason,
              isActive: false
            }
          });
        }
      });

      // Log audit event
      await this.auditLogger.logUserEvent(
        'ROLE_REVOKED',
        revokedById,
        id,
        undefined,
        undefined,
        { roles: revokeRolesDto.roles, reason: revokeRolesDto.reason }
      );

      // Emit event
      this.eventEmitter.emit('user.roles.revoked', {
        userId: id,
        roles: revokeRolesDto.roles,
        revokedBy: revokedById,
        reason: revokeRolesDto.reason,
        timestamp: new Date()
      });

      this.logger.log(`Roles revoked from user ${id}: ${revokeRolesDto.roles.join(', ')} by ${revokedById}`);

      return { message: 'Roles revoked successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error in revokeRoles: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to revoke roles');
    }
  }

  /**
   * Perform bulk role operations
   */
  async bulkRoleOperation(
    bulkRoleOperationDto: BulkRoleOperationDto,
    operatorId: string
  ): Promise<BulkOperationResponseDto> {
    try {
      const { userIds, roles, operation, reason, expiresAt } = bulkRoleOperationDto;

      // Validate bulk operation size
      if (userIds.length > this.maxUsersPerBulkOperation) {
        throw new BadRequestException(`Bulk operation limited to ${this.maxUsersPerBulkOperation} users`);
      }

      const results: BulkOperationResponseDto = {
        successCount: 0,
        failureCount: 0,
        totalCount: userIds.length,
        successes: [],
        failures: [],
        status: 'success',
        timestamp: new Date().toISOString()
      };

      // Process each user
      for (const userId of userIds) {
        try {
          if (operation === 'assign') {
            await this.assignRoles(userId, { roles, reason, expiresAt }, operatorId);
          } else {
            await this.revokeRoles(userId, { roles, reason }, operatorId);
          }

          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
          });

          results.successes.push({
            userId,
            userEmail: user?.email || 'Unknown',
            operation,
            details: { roles }
          });
          results.successCount++;
        } catch (error) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
          });

          results.failures.push({
            userId,
            userEmail: user?.email,
            operation,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: { roles }
          });
          results.failureCount++;
        }
      }

      // Determine overall status
      if (results.failureCount === 0) {
        results.status = 'success';
      } else if (results.successCount === 0) {
        results.status = 'failure';
      } else {
        results.status = 'partial_success';
      }

      // Emit event
      this.eventEmitter.emit('user.bulk.operation', {
        operation,
        operatorId,
        results,
        timestamp: new Date()
      });

      this.logger.log(`Bulk ${operation} operation completed by ${operatorId}: ${results.successCount}/${results.totalCount} successful`);

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error in bulkRoleOperation: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to perform bulk operation');
    }
  }

  /**
   * Deactivate a user (soft delete)
   */
  async remove(id: string, deletedById: string): Promise<{ message: string; deactivatedAt: string }> {
    try {
      // Prevent self-deletion
      if (id === deletedById) {
        throw new BadRequestException('Cannot delete your own account');
      }

      const deactivatedAt = new Date();

      // Start transaction
      await this.prisma.$transaction(async (tx: any) => {
        // Deactivate user
        await tx.user.update({
          where: { id },
          data: {
            isActive: false,
            updatedAt: deactivatedAt
          }
        });

        // Revoke all sessions
        await tx.session.updateMany({
          where: { userId: id },
          data: { isRevoked: true }
        });

        // Deactivate all roles
        await tx.userRole.updateMany({
          where: { userId: id },
          data: { isActive: false }
        });
      });

      // Emit event
      this.eventEmitter.emit('user.deleted', {
        userId: id,
        deletedBy: deletedById,
        deactivatedAt,
        timestamp: new Date()
      });

      this.logger.log(`User deactivated: ${id} by ${deletedById}`);

      return {
        message: 'User deactivated successfully',
        deactivatedAt: deactivatedAt.toISOString()
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error in remove: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to deactivate user');
    }
  }

  /**
   * Export users data
   */
  async exportUsers(query: QueryUsersDto, exportedById: string) {
    try {
      // This is a simplified implementation
      // In production, you would use a proper export service
      const users = await this.findAll(query, exportedById);

      // Emit event for audit
      this.eventEmitter.emit('user.data.exported', {
        exportedBy: exportedById,
        filters: query,
        recordCount: users.data.length,
        timestamp: new Date()
      });

      return {
        message: 'Export completed successfully',
        downloadUrl: '/api/exports/users/' + crypto.randomUUID(),
        recordCount: users.data.length,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error in exportUsers: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to export users');
    }
  }

  // Private helper methods

  private async validateUserAccess(
    requestingUserId: string,
    targetUserId: string,
    operation: 'read' | 'update' | 'delete'
  ): Promise<void> {
    // This would integrate with your RBAC system
    // For now, implement basic validation
    if (requestingUserId === targetUserId) {
      // Users can always access their own data for read/update
      if (operation === 'delete') {
        throw new ForbiddenException('Cannot delete your own account');
      }
      return;
    }

    // Check if requesting user has admin permissions
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true }
        }
      }
    });

    const hasAdminRole = requestingUser?.userRoles.some(
      (ur: any) => ur.role.name === 'SUPER_ADMIN' || ur.role.name === 'FUND_MANAGER'
    );

    if (!hasAdminRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async getUserStats(userId: string) {
    // Get user statistics
    const [loginCount, lastActivity, investmentData] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'LOGIN'
        }
      }),
      this.prisma.auditLog.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      this.prisma.investment.aggregate({
        where: { userId },
        _count: true,
        _sum: { commitmentAmount: true }
      })
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    const accountAge = user ?
      Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      loginCount,
      lastActivityAt: lastActivity?.createdAt?.toISOString(),
      accountAge,
      investmentCount: investmentData._count || 0,
      totalInvestmentValue: Number(investmentData._sum.commitmentAmount) || 0
    };
  }

  private async generateGrowthStats(groupBy: string, dateFilter: any) {
    // Simplified growth statistics
    // In production, you would implement proper time-series aggregation
    return [
      {
        period: '2024-01',
        newUsers: 45,
        totalUsers: 1200,
        activeUsers: 950
      },
      {
        period: '2024-02',
        newUsers: 38,
        totalUsers: 1238,
        activeUsers: 980
      }
      // Add more periods as needed
    ];
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    options: { days?: number; limit?: number; action?: string },
    requestedBy: string
  ) {
    const { days = 30, limit = 50, action } = options;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Calculate date range
    const dateFilter = days > 0 ? {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    } : undefined;

    // Build where clause
    const where: any = {
      userId: userId,
      ...(dateFilter && { createdAt: dateFilter }),
      ...(action && { action })
    };

    // Fetch audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where,
      take: Math.min(limit, 100), // Cap at 100 items
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        resource: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    });

    // Transform the data for frontend consumption
    const activities = auditLogs.map(log => {
      // Generate human-readable title and description
      const { title, description, type } = this.formatAuditLogActivity(log.action, log.resource ?? undefined, log.details);

      return {
        id: log.id,
        type: type,
        title: title,
        description: description,
        performedBy: this.getPerformerFromDetails(log.details) || 'System',
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        rawAction: log.action,
        rawResource: log.resource
      };
    });

    return {
      data: activities,
      meta: {
        total: auditLogs.length,
        days: days,
        action: action || null,
        requestedBy: requestedBy
      }
    };
  }

  /**
   * Format audit log entry into human-readable activity
   */
  private formatAuditLogActivity(action: string, resource?: string, details?: any) {
    const actionMap = {
      'LOGIN': {
        type: 'LOGIN',
        title: 'User Login',
        description: 'Successful login to the system'
      },
      'LOGOUT': {
        type: 'LOGOUT',
        title: 'User Logout',
        description: 'User logged out from the system'
      },
      'USER_CREATED': {
        type: 'PROFILE_UPDATED',
        title: 'Account Created',
        description: 'User account was created'
      },
      'USER_UPDATED': {
        type: 'PROFILE_UPDATED',
        title: 'Profile Updated',
        description: 'User profile information was updated'
      },
      'USER_STATUS_CHANGED': {
        type: 'PROFILE_UPDATED',
        title: 'Account Status Changed',
        description: 'User account status was modified'
      },
      'USER_VERIFICATION_CHANGED': {
        type: 'PROFILE_UPDATED',
        title: 'Verification Status Changed',
        description: 'Email verification status was updated'
      },
      'USER_PASSWORD_RESET': {
        type: 'PASSWORD_CHANGED',
        title: 'Password Reset',
        description: 'User password was reset by administrator'
      },
      'USER_ROLES_ASSIGNED': {
        type: 'ROLE_ASSIGNED',
        title: 'Role Assigned',
        description: 'New role was assigned to user'
      },
      'USER_ROLES_REVOKED': {
        type: 'ROLE_REMOVED',
        title: 'Role Revoked',
        description: 'Role was removed from user'
      },
      'USER_DETAILS_ACCESSED': {
        type: 'LOGIN',
        title: 'Profile Accessed',
        description: 'User details were viewed'
      }
    };

    const mapping = actionMap[action as keyof typeof actionMap] || {
      type: 'LOGIN',
      title: action.replace(/_/g, ' ').toLowerCase(),
      description: `${action.replace(/_/g, ' ').toLowerCase()} action performed`
    };

    // Enhance description with details if available
    if (details && typeof details === 'object') {
      if (details.roleName) {
        mapping.description = `${mapping.description}: ${details.roleName}`;
      } else if (details.targetUserId) {
        mapping.description = `${mapping.description} for user ${details.targetUserId}`;
      }
    }

    return mapping;
  }

  /**
   * Extract performer information from audit details
   */
  private getPerformerFromDetails(details?: any): string | null {
    if (!details || typeof details !== 'object') return null;

    // Check for various performer identifiers
    if (details.performedBy) return details.performedBy;
    if (details.assignedBy) return `Admin (${details.assignedBy})`;
    if (details.revokedBy) return `Admin (${details.revokedBy})`;
    if (details.updatedBy) return `Admin (${details.updatedBy})`;

    return null;
  }
}