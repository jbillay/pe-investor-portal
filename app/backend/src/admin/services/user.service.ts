import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private readonly eventEmitter: EventEmitter2
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
          // Check if role already assigned
          const existingAssignment = await tx.userRole.findFirst({
            where: {
              userId: id,
              roleId: role.id,
              isActive: true
            }
          });

          if (!existingAssignment) {
            // Create user role
            await tx.userRole.create({
              data: {
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
}