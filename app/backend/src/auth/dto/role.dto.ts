import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// Enums for predefined roles
export enum RoleName {
  ADMIN = 'ADMIN',
  INVESTOR = 'INVESTOR',
  USER = 'USER',
}

// Create Role DTO
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'INVESTOR',
    enum: RoleName,
  })
  @IsEnum(RoleName)
  @IsNotEmpty()
  name: RoleName;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Investor with access to portfolio management',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this role is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a default role for new users',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// Update Role DTO
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({
    description: 'Role ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsOptional()
  id?: string;
}

// Assign Role to User DTO
export class AssignRoleDto {
  @ApiProperty({
    description: 'User ID to assign role to',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Role ID to assign',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Reason for role assignment',
    example: 'Promoted to investor status',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Role expiration date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// Revoke Role DTO
export class RevokeRoleDto {
  @ApiProperty({
    description: 'User ID to revoke role from',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Role ID to revoke',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Reason for role revocation',
    example: 'Access no longer required',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

// Bulk Role Assignment DTO
export class BulkAssignRolesDto {
  @ApiProperty({
    description: 'Array of user IDs',
    example: ['cljk0x5a10001qz6z9k8z9k8z', 'cljk0x5a10001qz6z9k8z9k8w'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  userIds: string[];

  @ApiProperty({
    description: 'Role ID to assign to all users',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Reason for bulk assignment',
    example: 'Bulk promotion to investor status',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Role expiration date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// Role Response DTO
export class RoleResponseDto {
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
    description: 'Whether this is a default role for new users',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Role creation date',
    example: '2025-01-09T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Role last update date',
    example: '2025-01-09T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of users with this role',
    example: 5,
  })
  userCount?: number;

  @ApiPropertyOptional({
    description: 'Role permissions',
    type: [String],
  })
  permissions?: string[];
}

// User with Roles Response DTO
export class UserWithRolesResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User roles',
    type: [RoleResponseDto],
  })
  roles: RoleResponseDto[];

  @ApiPropertyOptional({
    description: 'User permissions (aggregated from roles)',
    type: [String],
  })
  permissions?: string[];
}

// Role Assignment History Response DTO
export class RoleAssignmentResponseDto {
  @ApiProperty({
    description: 'Assignment ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  userId: string;

  @ApiProperty({
    description: 'Role ID',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  roleId: string;

  @ApiProperty({
    description: 'Role information',
    type: RoleResponseDto,
  })
  role: RoleResponseDto;

  @ApiProperty({
    description: 'User who assigned the role',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  assignedBy: string | null;

  @ApiProperty({
    description: 'Reason for assignment',
    example: 'Promoted to investor status',
  })
  reason: string | null;

  @ApiProperty({
    description: 'Role expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'When the role was revoked',
    example: '2024-12-31T23:59:59Z',
  })
  revokedAt: Date | null;

  @ApiProperty({
    description: 'User who revoked the role',
    example: 'cljk0x5a10001qz6z9k8z9k8z',
  })
  revokedBy: string | null;

  @ApiProperty({
    description: 'Reason for revocation',
    example: 'Access no longer required',
  })
  revokeReason: string | null;

  @ApiProperty({
    description: 'Whether the assignment is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Assignment creation date',
    example: '2025-01-09T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Assignment last update date',
    example: '2025-01-09T10:30:00.000Z',
  })
  updatedAt: Date;
}