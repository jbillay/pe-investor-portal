import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserRoleSetupService } from '../services/user-role-setup.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOnly, RequireAnyRole } from '../decorators/role.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

class AssignRoleToUserDto {
  userId: string;
  roleName: string;
  reason?: string;
}

class BulkRoleAssignmentDto {
  assignments: Array<{
    userId: string;
    roleName: string;
    reason?: string;
  }>;
}

class CheckUserAccessDto {
  resource: string;
  action: string;
}

@ApiTags('User Role Management')
@Controller('admin/user-roles')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class UserRoleManagementController {
  constructor(private userRoleSetupService: UserRoleSetupService) {}

  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Assign a specific role to a user with optional reason. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'string' },
        roleName: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: AssignRoleToUserDto })
  @AdminOnly()
  @Post('assign')
  async assignRoleToUser(
    @Body() assignDto: AssignRoleToUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (assignDto.roleName === 'FUND_MANAGER') {
      await this.userRoleSetupService.promoteUserToFundManager(
        assignDto.userId,
        user.id,
        { reason: assignDto.reason }
      );
    } else if (assignDto.roleName === 'COMPLIANCE_OFFICER') {
      await this.userRoleSetupService.assignComplianceOfficerRole(
        assignDto.userId,
        user.id,
        { reason: assignDto.reason }
      );
    } else {
      // Generic role assignment - would need to implement in UserRoleSetupService
      throw new Error('Generic role assignment not yet implemented');
    }

    return {
      message: `Successfully assigned ${assignDto.roleName} role to user`,
      userId: assignDto.userId,
      roleName: assignDto.roleName,
    };
  }

  @ApiOperation({
    summary: 'Bulk assign roles',
    description: 'Assign roles to multiple users at once. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk assignment completed',
    schema: {
      type: 'object',
      properties: {
        successCount: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: BulkRoleAssignmentDto })
  @AdminOnly()
  @Post('bulk-assign')
  async bulkAssignRoles(
    @Body() bulkDto: BulkRoleAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const assignments = bulkDto.assignments.map(assignment => ({
      userId: assignment.userId,
      roleName: assignment.roleName,
      assignedBy: user.id,
      metadata: {
        reason: assignment.reason,
      },
    }));

    return this.userRoleSetupService.bulkAssignRolesToUsers(assignments);
  }

  @ApiOperation({
    summary: 'Initialize user permissions',
    description: 'Initialize default permissions for a user (typically called on first login). Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions initialized successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Post('initialize/:userId')
  async initializeUserPermissions(@Param('userId') userId: string) {
    await this.userRoleSetupService.initializeUserPermissions(userId);

    return {
      message: 'User permissions initialized successfully',
      userId,
    };
  }

  @ApiOperation({
    summary: 'Initialize current user permissions',
    description: 'Initialize default permissions for the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user permissions initialized successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Post('initialize/me')
  async initializeCurrentUserPermissions(@CurrentUser() user: AuthenticatedUser) {
    await this.userRoleSetupService.initializeUserPermissions(user.id);

    return {
      message: 'Your permissions have been initialized successfully',
      userId: user.id,
    };
  }

  @ApiOperation({
    summary: 'Check user access',
    description: 'Check if a user has permission to access a specific resource and action.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access check completed',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean' },
        permissions: { type: 'array', items: { type: 'string' } },
        roles: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: CheckUserAccessDto })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Post('check-access/:userId')
  async checkUserAccess(
    @Param('userId') userId: string,
    @Body() checkDto: CheckUserAccessDto,
  ) {
    return this.userRoleSetupService.checkUserAccess(
      userId,
      checkDto.resource,
      checkDto.action
    );
  }

  @ApiOperation({
    summary: 'Check current user access',
    description: 'Check if the current authenticated user has permission to access a specific resource and action.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access check completed',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean' },
        permissions: { type: 'array', items: { type: 'string' } },
        roles: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: CheckUserAccessDto })
  @Post('check-access/me')
  async checkCurrentUserAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Body() checkDto: CheckUserAccessDto,
  ) {
    return this.userRoleSetupService.checkUserAccess(
      user.id,
      checkDto.resource,
      checkDto.action
    );
  }

  @ApiOperation({
    summary: 'Get user effective permissions',
    description: 'Get all effective permissions for a user (aggregated from all assigned roles).',
  })
  @ApiResponse({
    status: 200,
    description: 'User effective permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
        resourcePermissions: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Get('effective-permissions/:userId')
  async getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.userRoleSetupService.getUserEffectivePermissions(userId);
  }

  @ApiOperation({
    summary: 'Get current user effective permissions',
    description: 'Get all effective permissions for the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user effective permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
        resourcePermissions: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get('effective-permissions/me')
  async getCurrentUserEffectivePermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.userRoleSetupService.getUserEffectivePermissions(user.id);
  }

  @ApiOperation({
    summary: 'Get recommended role for user',
    description: 'Get AI-recommended role for a user based on their activity and investments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role recommendation retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        recommendedRole: { type: 'string' },
        reason: { type: 'string' },
        confidence: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @AdminOnly()
  @Get('recommend-role/:userId')
  async getRecommendedRole(@Param('userId') userId: string) {
    return this.userRoleSetupService.getRecommendedRoleForUser(userId);
  }

  @ApiOperation({
    summary: 'Remove all user roles',
    description: 'Remove all roles from a user (for cleanup or role reset). Requires ADMIN role.',
  })
  @ApiResponse({
    status: 204,
    description: 'All roles removed successfully',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @AdminOnly()
  @Delete('remove-all/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAllUserRoles(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.userRoleSetupService.removeAllUserRoles(
      userId,
      user.id,
      'Admin-requested role cleanup'
    );
  }
}