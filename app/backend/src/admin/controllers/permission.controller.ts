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
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
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
import { PermissionService } from '../services/permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  PermissionResponseDto,
  RoleWithPermissionsResponseDto,
  CheckPermissionDto,
  PermissionCheckResponseDto,
  UserPermissionsResponseDto,
} from '../dto/permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOnly, RequireAnyRole } from '../decorators/role.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Permission Management')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @ApiOperation({
    summary: 'Create new permission',
    description: 'Create a new permission in the system. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: PermissionResponseDto,
  })
  @ApiConflictResponse({ description: 'Permission with this name already exists' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: CreatePermissionDto })
  @AdminOnly()
  @Post()
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.createPermission(createPermissionDto, user.id);
  }

  @ApiOperation({
    summary: 'Get all permissions',
    description: 'Retrieve all permissions in the system. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    type: [PermissionResponseDto],
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive permissions in the response',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @AdminOnly()
  @Get()
  async getAllPermissions(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ): Promise<PermissionResponseDto[]> {
    return this.permissionService.getAllPermissions(includeInactive);
  }

  @ApiOperation({
    summary: 'Get permissions by resource',
    description: 'Retrieve permissions grouped by resource type. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions grouped by resource retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/PermissionResponseDto' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @AdminOnly()
  @Get('by-resource')
  async getPermissionsByResource(): Promise<Record<string, PermissionResponseDto[]>> {
    return this.permissionService.getPermissionsByResource();
  }

  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieve a specific permission by its ID. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @AdminOnly()
  @Get(':id')
  async getPermissionById(@Param('id', ParseCuidPipe) permissionId: string): Promise<PermissionResponseDto> {
    return this.permissionService.getPermissionById(permissionId);
  }

  @ApiOperation({
    summary: 'Get permission by name',
    description: 'Retrieve a specific permission by its name. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'name', description: 'Permission name' })
  @RequireAnyRole('SUPER_ADMIN', 'INVESTOR')
  @Get('name/:name')
  async getPermissionByName(@Param('name') name: string): Promise<PermissionResponseDto> {
    return this.permissionService.getPermissionByName(name);
  }

  @ApiOperation({
    summary: 'Update permission',
    description: 'Update an existing permission. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiBody({ type: UpdatePermissionDto })
  @AdminOnly()
  @Put(':id')
  async updatePermission(
    @Param('id', ParseCuidPipe) permissionId: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.updatePermission(permissionId, updatePermissionDto, user.id);
  }

  @ApiOperation({
    summary: 'Delete permission',
    description: 'Soft delete a permission (set as inactive). Requires ADMIN role.',
  })
  @ApiResponse({
    status: 204,
    description: 'Permission deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiBadRequestResponse({ description: 'Cannot delete permission assigned to roles' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(
    @Param('id', ParseCuidPipe) permissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.permissionService.deletePermission(permissionId, user.id);
  }

  @ApiOperation({
    summary: 'Assign permission to role',
    description: 'Assign a specific permission to a role. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Permission assigned successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Role or permission not found' })
  @ApiConflictResponse({ description: 'Role already has this permission' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: AssignPermissionToRoleDto })
  @AdminOnly()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 assignments per minute
  @Post('assign')
  async assignPermissionToRole(
    @Body() assignDto: AssignPermissionToRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.permissionService.assignPermissionToRole(assignDto, user.id);
    return { message: 'Permission assigned successfully' };
  }

  @ApiOperation({
    summary: 'Revoke permission from role',
    description: 'Remove a specific permission from a role. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission revoked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Permission revoked successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Role does not have this permission' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: RevokePermissionFromRoleDto })
  @AdminOnly()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 revocations per minute
  @Post('revoke')
  async revokePermissionFromRole(
    @Body() revokeDto: RevokePermissionFromRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.permissionService.revokePermissionFromRole(revokeDto, user.id);
    return { message: 'Permission revoked successfully' };
  }

  @ApiOperation({
    summary: 'Bulk assign permissions',
    description: 'Assign multiple permissions to a role at once. Requires ADMIN role.',
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
              permissionId: { type: 'string' },
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
  @ApiBody({ type: BulkAssignPermissionsDto })
  @AdminOnly()
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 bulk operations per 5 minutes
  @Post('bulk-assign')
  async bulkAssignPermissions(
    @Body() bulkAssignDto: BulkAssignPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ successCount: number; failures: Array<{ permissionId: string; error: string }> }> {
    return this.permissionService.bulkAssignPermissions(bulkAssignDto, user.id);
  }

  @ApiOperation({
    summary: 'Get role permissions',
    description: 'Get all permissions assigned to a specific role. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role permissions retrieved successfully',
    type: RoleWithPermissionsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @RequireAnyRole('SUPER_ADMIN', 'INVESTOR')
  @Get('role/:roleId')
  async getRolePermissions(@Param('roleId') roleId: string): Promise<RoleWithPermissionsResponseDto> {
    return this.permissionService.getRolePermissions(roleId);
  }

  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Get all permissions for a specific user (aggregated from roles). Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
    type: UserPermissionsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @RequireAnyRole('SUPER_ADMIN', 'INVESTOR')
  @Get('user/:userId')
  async getUserPermissions(@Param('userId') userId: string): Promise<UserPermissionsResponseDto> {
    return this.permissionService.getUserPermissions(userId);
  }

  @ApiOperation({
    summary: 'Get current user permissions',
    description: 'Get all permissions for the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user permissions retrieved successfully',
    type: UserPermissionsResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @Get('me/permissions')
  async getCurrentUserPermissions(@CurrentUser() user: AuthenticatedUser): Promise<UserPermissionsResponseDto> {
    return this.permissionService.getUserPermissions(user.id);
  }

  @ApiOperation({
    summary: 'Check user permission',
    description: 'Check if a user has a specific permission. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission check completed',
    type: PermissionCheckResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: CheckPermissionDto })
  @RequireAnyRole('SUPER_ADMIN', 'INVESTOR')
  @Post('check/:userId')
  async checkUserPermission(
    @Param('userId') userId: string,
    @Body() checkDto: CheckPermissionDto,
  ): Promise<PermissionCheckResponseDto> {
    return this.permissionService.checkUserPermission(userId, checkDto);
  }

  @ApiOperation({
    summary: 'Check current user permission',
    description: 'Check if the current authenticated user has a specific permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission check completed',
    type: PermissionCheckResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBody({ type: CheckPermissionDto })
  @Post('check/me')
  async checkCurrentUserPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() checkDto: CheckPermissionDto,
  ): Promise<PermissionCheckResponseDto> {
    return this.permissionService.checkUserPermission(user.id, checkDto);
  }

  @ApiOperation({
    summary: 'Get permissions for resource',
    description: 'Get all permissions available for a specific resource type. Requires ADMIN or INVESTOR role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resource permissions retrieved successfully',
    type: [PermissionResponseDto],
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiParam({ name: 'resource', description: 'Resource type (e.g., USER, ROLE, PORTFOLIO)' })
  @RequireAnyRole('SUPER_ADMIN', 'INVESTOR')
  @Get('resource/:resource')
  async getPermissionsForResource(@Param('resource') resource: string): Promise<PermissionResponseDto[]> {
    return this.permissionService.getPermissionsForResource(resource);
  }
}