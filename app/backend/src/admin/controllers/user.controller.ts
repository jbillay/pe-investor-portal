import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
  ApiExtraModels
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { RequireRoles, RequireAnyRole } from '../decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';

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
  UserStatsResponseDto
} from '../dto';

/**
 * User Management Controller
 *
 * Provides comprehensive CRUD operations and advanced user management features
 * including role management, bulk operations, statistics, and audit logging.
 *
 * Security Features:
 * - JWT Authentication required for all endpoints
 * - Role-based access control (RBAC)
 * - Permission-based authorization
 * - Rate limiting on sensitive operations
 * - Comprehensive audit logging
 * - Input validation and sanitization
 *
 * @author Backend Team
 * @version 1.0.0
 */
@ApiTags('User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiSecurity('bearer')
@ApiExtraModels(
  UserResponseDto,
  DetailedUserResponseDto,
  PaginatedUsersResponseDto,
  UserCreatedResponseDto,
  BulkOperationResponseDto,
  UserStatsResponseDto
)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Get paginated list of users with advanced filtering and sorting
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of users matching the criteria
   */
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: `
      Retrieve a paginated list of users with advanced filtering, sorting, and search capabilities.

      Features:
      - Full-text search across name and email fields
      - Filter by status, verification, roles, language, timezone
      - Date range filtering for creation and last login
      - Flexible sorting options
      - Include/exclude related data (profile, roles, statistics)
      - Configurable pagination (1-100 items per page)

      Security: Requires SUPER_ADMIN role or USER_READ permission
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved users',
    type: PaginatedUsersResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions'
  })
  @RequirePermissions('USER_READ')
  @RequireAnyRole('SUPER_ADMIN', 'FUND_MANAGER', 'COMPLIANCE_OFFICER')
  @AuditLog('USER_LIST_ACCESSED')
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: QueryUsersDto,
    @Request() req: AuthenticatedRequest
  ): Promise<PaginatedUsersResponseDto> {
    this.logger.log(`User ${req.user.id} requested user list with filters: ${JSON.stringify(query)}`);
    return this.userService.findAll(query, req.user.id);
  }

  /**
   * Get user statistics and analytics
   *
   * @param query - Query parameters for statistics period and grouping
   * @returns Comprehensive user statistics and analytics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: `
      Retrieve comprehensive user statistics and analytics including:
      - Total user counts by status and role
      - User growth trends over time
      - Activity and engagement metrics
      - Geographic distribution
      - Custom date range analysis

      Security: Requires SUPER_ADMIN role or ANALYTICS_READ permission
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user statistics',
    type: UserStatsResponseDto
  })
  @RequirePermissions('ANALYTICS_READ')
  @RequireAnyRole('SUPER_ADMIN', 'COMPLIANCE_OFFICER')
  @AuditLog('USER_STATS_ACCESSED')
  async getStats(
    @Query(new ValidationPipe({ transform: true })) query: UserStatsQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<UserStatsResponseDto> {
    this.logger.log(`User ${req.user.id} requested user statistics`);
    return this.userService.getStatistics(query);
  }

  /**
   * Get detailed information about a specific user
   *
   * @param id - User CUID
   * @returns Detailed user information including profile, roles, and statistics
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: `
      Retrieve detailed information about a specific user including:
      - Basic user information
      - Profile data (phone, preferences, etc.)
      - Current role assignments
      - User statistics and activity history

      Security: Requires SUPER_ADMIN role or USER_READ permission
      Users can also access their own profile with USER_READ_OWN permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user details',
    type: DetailedUserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @RequirePermissions('USER_READ')
  @AuditLog('USER_DETAILS_ACCESSED')
  async findOne(
    @Param('id', ParseCuidPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<DetailedUserResponseDto> {
    this.logger.log(`User ${req.user.id} requested details for user ${id}`);
    return this.userService.findOne(id, req.user.id);
  }

  /**
   * Create a new user account
   *
   * @param createUserDto - User creation data
   * @returns Created user information with temporary credentials
   */
  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: `
      Create a new user account with comprehensive validation and security features:
      - Strong password requirements
      - Email uniqueness validation
      - Optional role assignment
      - Automatic profile creation
      - Email verification workflow
      - Audit trail creation

      Security: Requires SUPER_ADMIN role or USER_CREATE permission
      Rate limited to prevent abuse
    `
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserCreatedResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or email already exists'
  })
  @ApiResponse({
    status: 409,
    description: 'User with email already exists'
  })
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('USER_CREATE')
  @RequireAnyRole('SUPER_ADMIN', 'FUND_MANAGER')
  @RateLimit({ limit: 10, window: 300 }) // 10 requests per 5 minutes
  @AuditLog('USER_CREATED')
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Request() req: AuthenticatedRequest
  ): Promise<UserCreatedResponseDto> {
    this.logger.log(`User ${req.user.id} creating new user: ${createUserDto.email}`);
    return this.userService.create(createUserDto, req.user.id);
  }

  /**
   * Update user information
   *
   * @param id - User CUID
   * @param updateUserDto - Updated user data
   * @returns Updated user information
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update user',
    description: `
      Update user information with validation and conflict detection:
      - Email uniqueness validation
      - Optimistic locking for concurrent updates
      - Profile information updates
      - Preference management
      - Change tracking and audit logging

      Security: Requires SUPER_ADMIN role or USER_UPDATE permission
      Users can update their own profile with USER_UPDATE_OWN permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: DetailedUserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists or concurrent update conflict'
  })
  @RequirePermissions('USER_UPDATE')
  @AuditLog('USER_UPDATED')
  async update(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest
  ): Promise<DetailedUserResponseDto> {
    this.logger.log(`User ${req.user.id} updating user ${id}`);
    return this.userService.update(id, updateUserDto, req.user.id);
  }

  /**
   * Update user status (activate/deactivate)
   *
   * @param id - User CUID
   * @param updateStatusDto - Status update data
   * @returns Updated user information
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user status',
    description: `
      Activate or deactivate a user account with proper validation:
      - Prevents self-deactivation
      - Revokes active sessions on deactivation
      - Sends notification emails
      - Creates detailed audit trail
      - Handles dependent resource cleanup

      Security: Requires SUPER_ADMIN role or USER_STATUS_UPDATE permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'User status successfully updated',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate own account or invalid status'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @RequirePermissions('USER_UPDATE')
  @RequireAnyRole('SUPER_ADMIN', 'COMPLIANCE_OFFICER')
  @AuditLog('USER_STATUS_CHANGED')
  async updateStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) updateStatusDto: UpdateUserStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<UserResponseDto> {
    this.logger.log(`User ${req.user.id} updating status for user ${id} to ${updateStatusDto.isActive}`);
    return this.userService.updateStatus(id, updateStatusDto, req.user.id);
  }

  /**
   * Update user email verification status
   *
   * @param id - User CUID
   * @param updateVerificationDto - Verification update data
   * @returns Updated user information
   */
  @Patch(':id/verification')
  @ApiOperation({
    summary: 'Update user verification status',
    description: `
      Manually update user email verification status:
      - Mark email as verified/unverified
      - Send verification emails if needed
      - Update user permissions based on verification
      - Create audit trail for manual verification

      Security: Requires SUPER_ADMIN role or USER_VERIFY permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'User verification status successfully updated',
    type: UserResponseDto
  })
  @RequirePermissions('USER_VERIFY')
  @RequireAnyRole('SUPER_ADMIN', 'COMPLIANCE_OFFICER')
  @AuditLog('USER_VERIFICATION_CHANGED')
  async updateVerification(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) updateVerificationDto: UpdateUserVerificationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<UserResponseDto> {
    this.logger.log(`User ${req.user.id} updating verification for user ${id} to ${updateVerificationDto.isVerified}`);
    return this.userService.updateVerification(id, updateVerificationDto, req.user.id);
  }

  /**
   * Reset user password
   *
   * @param id - User CUID
   * @param resetPasswordDto - Password reset data
   * @returns Success confirmation
   */
  @Post(':id/reset-password')
  @ApiOperation({
    summary: 'Reset user password',
    description: `
      Reset a user's password with security measures:
      - Generate secure temporary password
      - Force password change on next login
      - Revoke all existing sessions
      - Send password reset notification
      - Create detailed audit trail

      Security: Requires SUPER_ADMIN role or USER_PASSWORD_RESET permission
      Rate limited to prevent abuse
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot reset own password through this endpoint'
  })
  @RequirePermissions('USER_PASSWORD_RESET')
  @RequireRoles('SUPER_ADMIN')
  @RateLimit({ limit: 5, window: 300 }) // 5 requests per 5 minutes
  @AuditLog('USER_PASSWORD_RESET')
  async resetPassword(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string; temporaryPassword?: string }> {
    this.logger.log(`User ${req.user.id} resetting password for user ${id}`);
    return this.userService.resetPassword(id, resetPasswordDto, req.user.id);
  }

  /**
   * Get user role assignments
   *
   * @param id - User CUID
   * @param query - Query parameters for role filtering
   * @returns User's current and historical role assignments
   */
  @Get(':id/roles')
  @ApiOperation({
    summary: 'Get user roles',
    description: `
      Retrieve user's role assignments with optional filtering:
      - Current active roles
      - Historical role assignments
      - Role permissions (if requested)
      - Assignment and expiration details
      - Assignment audit trail

      Security: Requires SUPER_ADMIN role or USER_ROLES_READ permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user roles'
  })
  @RequirePermissions('USER_READ')
  @AuditLog('USER_ROLES_ACCESSED')
  async getUserRoles(
    @Param('id', ParseCuidPipe) id: string,
    @Query(new ValidationPipe({ transform: true })) query: QueryUserRolesDto,
    @Request() req: AuthenticatedRequest
  ) {
    this.logger.log(`User ${req.user.id} requested roles for user ${id}`);
    return this.userService.getUserRoles(id, query);
  }

  /**
   * Assign roles to a user
   *
   * @param id - User CUID
   * @param assignRolesDto - Role assignment data
   * @returns Updated role assignments
   */
  @Post(':id/roles')
  @ApiOperation({
    summary: 'Assign roles to user',
    description: `
      Assign one or more roles to a user with validation:
      - Role existence validation
      - Duplicate assignment prevention
      - Optional expiration dates
      - Assignment reason tracking
      - Automatic permission updates
      - Notification to user

      Security: Requires SUPER_ADMIN role or USER_ROLES_ASSIGN permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'Roles successfully assigned'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid roles or assignment conflict'
  })
  @RequirePermissions('USER_ROLES_ASSIGN')
  @RequireAnyRole('SUPER_ADMIN', 'FUND_MANAGER')
  @AuditLog('USER_ROLES_ASSIGNED')
  async assignRoles(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) assignRolesDto: AssignRolesDto,
    @Request() req: AuthenticatedRequest
  ) {
    this.logger.log(`User ${req.user.id} assigning roles ${assignRolesDto.roles} to user ${id}`);
    return this.userService.assignRoles(id, assignRolesDto, req.user.id);
  }

  /**
   * Revoke roles from a user
   *
   * @param id - User CUID
   * @param revokeRolesDto - Role revocation data
   * @returns Updated role assignments
   */
  @Delete(':id/roles')
  @ApiOperation({
    summary: 'Revoke roles from user',
    description: `
      Revoke one or more roles from a user with validation:
      - Role assignment existence validation
      - Prevents removing all roles (at least one must remain)
      - Revocation reason tracking
      - Automatic permission updates
      - Session cleanup if needed
      - Notification to user

      Security: Requires SUPER_ADMIN role or USER_ROLES_REVOKE permission
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'Roles successfully revoked'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot revoke role - user must have at least one role'
  })
  @RequirePermissions('USER_ROLES_REVOKE')
  @RequireAnyRole('SUPER_ADMIN', 'FUND_MANAGER')
  @AuditLog('USER_ROLES_REVOKED')
  async revokeRoles(
    @Param('id', ParseCuidPipe) id: string,
    @Body(ValidationPipe) revokeRolesDto: RevokeRolesDto,
    @Request() req: AuthenticatedRequest
  ) {
    this.logger.log(`User ${req.user.id} revoking roles ${revokeRolesDto.roles} from user ${id}`);
    return this.userService.revokeRoles(id, revokeRolesDto, req.user.id);
  }

  /**
   * Perform bulk role operations on multiple users
   *
   * @param bulkRoleOperationDto - Bulk operation data
   * @returns Operation results with success/failure details
   */
  @Post('bulk/roles')
  @ApiOperation({
    summary: 'Bulk role operations',
    description: `
      Perform role assignments or revocations on multiple users:
      - Atomic operations with rollback on failure
      - Detailed success/failure reporting
      - Individual user validation
      - Batch audit logging
      - Progress tracking for large operations
      - Email notifications to affected users

      Security: Requires SUPER_ADMIN role or USER_BULK_OPERATIONS permission
      Rate limited to prevent system overload
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid operation data or too many users'
  })
  @RequirePermissions('USER_BULK_OPERATIONS')
  @RequireRoles('SUPER_ADMIN')
  @RateLimit({ limit: 3, window: 600 }) // 3 requests per 10 minutes
  @AuditLog('USER_BULK_ROLE_OPERATION')
  async bulkRoleOperation(
    @Body(ValidationPipe) bulkRoleOperationDto: BulkRoleOperationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<BulkOperationResponseDto> {
    this.logger.log(`User ${req.user.id} performing bulk ${bulkRoleOperationDto.operation} operation on ${bulkRoleOperationDto.userIds.length} users`);
    return this.userService.bulkRoleOperation(bulkRoleOperationDto, req.user.id);
  }

  /**
   * Soft delete a user account
   *
   * @param id - User CUID
   * @returns Deletion confirmation
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user (soft delete)',
    description: `
      Soft delete a user account with data retention:
      - Marks user as deleted but retains data
      - Revokes all active sessions
      - Anonymizes PII based on retention policy
      - Maintains audit trail
      - Handles dependent resource cleanup
      - Sends account closure notification

      Security: Requires SUPER_ADMIN role or USER_DELETE permission
      Cannot delete own account
    `
  })
  @ApiParam({
    name: 'id',
    description: 'User CUID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete own account'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @RequirePermissions('USER_DELETE')
  @RequireRoles('SUPER_ADMIN')
  @AuditLog('USER_DELETED')
  async remove(
    @Param('id', ParseCuidPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string; deactivatedAt: string }> {
    this.logger.log(`User ${req.user.id} deleting user ${id}`);
    return this.userService.remove(id, req.user.id);
  }

  /**
   * Export users data
   *
   * @param query - Export parameters
   * @returns Downloadable export file or download URL
   */
  @Get('export/data')
  @ApiOperation({
    summary: 'Export users data',
    description: `
      Export user data in various formats with privacy compliance:
      - CSV, Excel, JSON formats supported
      - Configurable field selection
      - Date range filtering
      - Privacy-compliant data masking
      - Audit trail for exports
      - Secure download links

      Security: Requires SUPER_ADMIN role or DATA_EXPORT permission
      Rate limited to prevent system overload
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Export file generated successfully'
  })
  @RequirePermissions('DATA_EXPORT')
  @RequireAnyRole('SUPER_ADMIN', 'COMPLIANCE_OFFICER')
  @RateLimit({ limit: 2, window: 3600 }) // 2 exports per hour
  @AuditLog('USER_DATA_EXPORTED')
  async exportUsers(
    @Query(new ValidationPipe({ transform: true })) query: QueryUsersDto,
    @Request() req: AuthenticatedRequest
  ) {
    this.logger.log(`User ${req.user.id} exporting user data`);
    return this.userService.exportUsers(query, req.user.id);
  }
}