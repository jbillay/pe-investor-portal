import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RevokeRoleDto,
  BulkAssignRolesDto,
  RoleResponseDto,
  UserWithRolesResponseDto,
  RoleAssignmentResponseDto,
} from '../dto/role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AdminOnly,
  RequireRoles,
  RequireAnyRole,
  RequireRoleManagement,
} from '../decorators/role.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Role Management')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @ApiOperation({
    summary: 'Create new role',
    description: 'Create a new role with specified permissions. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiConflictResponse({ description: 'Role with this name already exists' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: CreateRoleDto })
  @AdminOnly()
  @Post()
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    return this.roleService.createRole(createRoleDto, user.id);
  }

  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieve all roles in the system. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: [RoleResponseDto],
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive roles in the response',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @AdminOnly()
  @Get()
  async getAllRoles(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ): Promise<RoleResponseDto[]> {
    return this.roleService.getAllRoles(includeInactive);
  }

  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieve a specific role by its ID. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @AdminOnly()
  @Get(':id')
  async getRoleById(@Param('id') roleId: string): Promise<RoleResponseDto> {
    return this.roleService.getRoleById(roleId);
  }

  @ApiOperation({
    summary: 'Get role by name',
    description: 'Retrieve a specific role by its name. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'name', description: 'Role name' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Get('name/:name')
  async getRoleByName(@Param('name') name: string): Promise<RoleResponseDto> {
    return this.roleService.getRoleByName(name);
  }

  @ApiOperation({
    summary: 'Update role',
    description: 'Update an existing role. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @AdminOnly()
  @Put(':id')
  async updateRole(
    @Param('id') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    return this.roleService.updateRole(roleId, updateRoleDto, user.id);
  }

  @ApiOperation({
    summary: 'Delete role',
    description: 'Soft delete a role (set as inactive). Requires ADMIN role.',
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiBadRequestResponse({ description: 'Cannot delete role with active users' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param('id') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.roleService.deleteRole(roleId, user.id);
  }

  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Assign a specific role to a user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role assigned successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  @ApiConflictResponse({ description: 'User already has this role' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: AssignRoleDto })
  @AdminOnly()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 assignments per minute
  @Post('assign')
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    await this.roleService.assignRole(assignRoleDto, {
      assignedBy: user.id,
      userAgent,
      ipAddress,
    });

    return { message: 'Role assigned successfully' };
  }

  @ApiOperation({
    summary: 'Revoke role from user',
    description: 'Remove a specific role from a user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role revoked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role revoked successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User does not have this role' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: RevokeRoleDto })
  @AdminOnly()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 revocations per minute
  @Post('revoke')
  async revokeRole(
    @Body() revokeRoleDto: RevokeRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    await this.roleService.revokeRole(revokeRoleDto, {
      assignedBy: user.id,
      userAgent,
      ipAddress,
    });

    return { message: 'Role revoked successfully' };
  }

  @ApiOperation({
    summary: 'Bulk assign roles',
    description: 'Assign a role to multiple users at once. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk assignment completed',
    schema: {
      type: 'object',
      properties: {
        successCount: { type: 'number', example: 5 },
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
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: BulkAssignRolesDto })
  @AdminOnly()
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 bulk operations per 5 minutes
  @Post('bulk-assign')
  async bulkAssignRoles(
    @Body() bulkAssignDto: BulkAssignRolesDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ successCount: number; failures: Array<{ userId: string; error: string }> }> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    return this.roleService.bulkAssignRoles(bulkAssignDto, {
      assignedBy: user.id,
      userAgent,
      ipAddress,
    });
  }

  @ApiOperation({
    summary: 'Get user roles',
    description: 'Get all roles assigned to a specific user. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User roles retrieved successfully',
    type: UserWithRolesResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Get('user/:userId')
  async getUserRoles(@Param('userId') userId: string): Promise<UserWithRolesResponseDto> {
    return this.roleService.getUserRoles(userId);
  }

  @ApiOperation({
    summary: 'Get current user roles',
    description: 'Get all roles assigned to the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user roles retrieved successfully',
    type: UserWithRolesResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get('me/roles')
  async getCurrentUserRoles(@CurrentUser() user: AuthenticatedUser): Promise<UserWithRolesResponseDto> {
    return this.roleService.getUserRoles(user.id);
  }

  @ApiOperation({
    summary: 'Get role assignment history',
    description: 'Get the complete history of role assignments for a user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role assignment history retrieved successfully',
    type: [RoleAssignmentResponseDto],
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @AdminOnly()
  @Get('history/:userId')
  async getRoleAssignmentHistory(@Param('userId') userId: string): Promise<RoleAssignmentResponseDto[]> {
    return this.roleService.getRoleAssignmentHistory(userId);
  }

  @ApiOperation({
    summary: 'Get default role',
    description: 'Get the system default role assigned to new users. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 204,
    description: 'No default role configured',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Get('default')
  async getDefaultRole(): Promise<RoleResponseDto | null> {
    return this.roleService.getDefaultRole();
  }

  @ApiOperation({
    summary: 'Get users with role',
    description: 'Get all users that have a specific role. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users with role retrieved successfully',
    type: [UserWithRolesResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @AdminOnly()
  @Get(':roleId/users')
  async getUsersWithRole(@Param('roleId') roleId: string): Promise<UserWithRolesResponseDto[]> {
    return this.roleService.getUsersWithRole(roleId);
  }

  @ApiOperation({
    summary: 'Check user role',
    description: 'Check if a user has a specific role. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role check completed',
    schema: {
      type: 'object',
      properties: {
        hasRole: { type: 'boolean', example: true },
        role: { type: 'string', example: 'INVESTOR' },
        userId: { type: 'string', example: 'cljk0x5a10001qz6z9k8z9k8z' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'roleName', description: 'Role name to check' })
  @RequireAnyRole('ADMIN', 'INVESTOR')
  @Get('check/:userId/:roleName')
  async checkUserRole(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
  ): Promise<{ hasRole: boolean; role: string; userId: string }> {
    const hasRole = await this.roleService.userHasRole(userId, roleName);

    return {
      hasRole,
      role: roleName,
      userId,
    };
  }

  /**
   * Helper method to extract client IP address
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string)?.trim() ||
      req.connection?.remoteAddress?.trim() ||
      req.socket?.remoteAddress?.trim() ||
      'unknown'
    );
  }
}