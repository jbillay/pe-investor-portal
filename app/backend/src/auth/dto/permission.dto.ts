import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// Enums for predefined permissions
export enum PermissionName {
  // User Management
  CREATE_USER = 'CREATE_USER',
  VIEW_USER = 'VIEW_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',

  // Role Management
  CREATE_ROLE = 'CREATE_ROLE',
  VIEW_ROLE = 'VIEW_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  ASSIGN_ROLE = 'ASSIGN_ROLE',
  REVOKE_ROLE = 'REVOKE_ROLE',

  // Permission Management
  CREATE_PERMISSION = 'CREATE_PERMISSION',
  VIEW_PERMISSION = 'VIEW_PERMISSION',
  UPDATE_PERMISSION = 'UPDATE_PERMISSION',
  DELETE_PERMISSION = 'DELETE_PERMISSION',

  // Dashboard Access
  VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
  VIEW_INVESTOR_DASHBOARD = 'VIEW_INVESTOR_DASHBOARD',
  VIEW_USER_DASHBOARD = 'VIEW_USER_DASHBOARD',

  // Portfolio Management
  CREATE_PORTFOLIO = 'CREATE_PORTFOLIO',
  VIEW_PORTFOLIO = 'VIEW_PORTFOLIO',
  UPDATE_PORTFOLIO = 'UPDATE_PORTFOLIO',
  DELETE_PORTFOLIO = 'DELETE_PORTFOLIO',

  // System Management
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  VIEW_SYSTEM_METRICS = 'VIEW_SYSTEM_METRICS',
}

// Resource types for permissions
export enum ResourceType {
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  PORTFOLIO = 'PORTFOLIO',
  DASHBOARD = 'DASHBOARD',
  SYSTEM = 'SYSTEM',
  AUDIT = 'AUDIT',
}

// Action types for permissions
export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  REVOKE = 'REVOKE',
  MANAGE = 'MANAGE',
}

// Create Permission DTO
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name',
    example: 'VIEW_PORTFOLIO',
    enum: PermissionName,
  })
  @IsEnum(PermissionName)
  @IsNotEmpty()
  name: PermissionName;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Allows viewing portfolio data',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Resource this permission applies to',
    example: 'PORTFOLIO',
    enum: ResourceType,
  })
  @IsEnum(ResourceType)
  @IsOptional()
  resource?: ResourceType;

  @ApiPropertyOptional({
    description: 'Action this permission allows',
    example: 'READ',
    enum: ActionType,
  })
  @IsEnum(ActionType)
  @IsOptional()
  action?: ActionType;

  @ApiPropertyOptional({
    description: 'Whether this permission is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Update Permission DTO
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiPropertyOptional({
    description: 'Permission ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsOptional()
  id?: string;
}

// Assign Permission to Role DTO
export class AssignPermissionToRoleDto {
  @ApiProperty({
    description: 'Role ID to assign permission to',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Permission ID to assign',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}

// Revoke Permission from Role DTO
export class RevokePermissionFromRoleDto {
  @ApiProperty({
    description: 'Role ID to revoke permission from',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Permission ID to revoke',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}

// Bulk Assign Permissions to Role DTO
export class BulkAssignPermissionsDto {
  @ApiProperty({
    description: 'Role ID to assign permissions to',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Array of permission IDs',
    example: ['cljk0x5a10001qz6z9k8z9k8z', 'cljk0x5a10001qz6z9k8z9k8w'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  permissionIds: string[];
}

// Permission Response DTO
export class PermissionResponseDto {
  @ApiProperty({
    description: 'Permission ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  id: string;

  @ApiProperty({
    description: 'Permission name',
    example: 'VIEW_PORTFOLIO',
  })
  name: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Allows viewing portfolio data',
  })
  description: string | null;

  @ApiProperty({
    description: 'Resource this permission applies to',
    example: 'PORTFOLIO',
  })
  resource: string | null;

  @ApiProperty({
    description: 'Action this permission allows',
    example: 'READ',
  })
  action: string | null;

  @ApiProperty({
    description: 'Whether this permission is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Permission creation date',
    example: '2025-01-09T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Permission last update date',
    example: '2025-01-09T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of roles with this permission',
    example: 3,
  })
  roleCount?: number;
}

// Role with Permissions Response DTO
export class RoleWithPermissionsResponseDto {
  @ApiProperty({
    description: 'Role ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'INVESTOR',
  })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Investor with access to portfolio management',
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether this role is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Role permissions',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];
}

// Permission Check DTO
export class CheckPermissionDto {
  @ApiProperty({
    description: 'Permission name to check',
    example: 'VIEW_PORTFOLIO',
    enum: PermissionName,
  })
  @IsEnum(PermissionName)
  @IsNotEmpty()
  permission: PermissionName;

  @ApiPropertyOptional({
    description: 'Resource to check permission for',
    example: 'PORTFOLIO',
    enum: ResourceType,
  })
  @IsEnum(ResourceType)
  @IsOptional()
  resource?: ResourceType;

  @ApiPropertyOptional({
    description: 'Specific resource ID to check permission for',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsOptional()
  resourceId?: string;
}

// Permission Check Response DTO
export class PermissionCheckResponseDto {
  @ApiProperty({
    description: 'Whether the user has the permission',
    example: true,
  })
  hasPermission: boolean;

  @ApiProperty({
    description: 'Permission name that was checked',
    example: 'VIEW_PORTFOLIO',
  })
  permission: string;

  @ApiProperty({
    description: 'Resource that was checked',
    example: 'PORTFOLIO',
  })
  resource: string | null;

  @ApiProperty({
    description: 'User roles that grant this permission',
    type: [String],
  })
  grantedByRoles: string[];
}

// User Permissions Response DTO
export class UserPermissionsResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  userId: string;

  @ApiProperty({
    description: 'All user permissions (aggregated from roles)',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];

  @ApiProperty({
    description: 'User roles',
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Permissions grouped by resource',
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  permissionsByResource: Record<string, string[]>;
}