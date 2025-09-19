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

// Create Permission DTO
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name',
    example: 'VIEW_PORTFOLIO',
  })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Allows viewing portfolio data',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Resource this permission applies to',
    example: 'PORTFOLIO'
  })
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({
    description: 'Action this permission allows',
    example: 'READ',
  })
  @IsOptional()
  action?: string;

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
    example: 'VIEW_PORTFOLIO'
  })
  @IsNotEmpty()
  permission: string;

  @ApiPropertyOptional({
    description: 'Resource to check permission for',
    example: 'PORTFOLIO',
  })
  @IsOptional()
  resource?: string;

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