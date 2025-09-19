import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  MaxLength,
  IsBoolean,
  IsUUID
} from 'class-validator';

/**
 * DTO for assigning roles to a user
 */
export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of role IDs or names to assign to the user',
    example: ['INVESTOR', 'USER'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    description: 'Reason for role assignment (for audit purposes)',
    example: 'New investor onboarding',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;

  @ApiProperty({
    description: 'Optional expiration date for the role assignment',
    example: '2025-12-31T23:59:59Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  expiresAt?: string;
}

/**
 * DTO for revoking roles from a user
 */
export class RevokeRolesDto {
  @ApiProperty({
    description: 'Array of role IDs or names to revoke from the user',
    example: ['ADMIN'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    description: 'Reason for role revocation (for audit purposes)',
    example: 'User no longer requires admin access',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}

/**
 * DTO for bulk role operations
 */
export class BulkRoleOperationDto {
  @ApiProperty({
    description: 'Array of user IDs to perform the operation on',
    example: ['user-1', 'user-2', 'user-3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Array of role IDs or names for the operation',
    example: ['INVESTOR'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    description: 'Operation type: assign or revoke',
    example: 'assign',
    enum: ['assign', 'revoke']
  })
  @IsString()
  operation: 'assign' | 'revoke';

  @ApiProperty({
    description: 'Reason for bulk operation (for audit purposes)',
    example: 'Quarterly role review - bulk investor role assignment',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;

  @ApiProperty({
    description: 'Optional expiration date for role assignments (only for assign operation)',
    example: '2025-12-31T23:59:59Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  expiresAt?: string;
}

/**
 * DTO for querying user role assignments
 */
export class QueryUserRolesDto {
  @ApiProperty({
    description: 'Include only active role assignments',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiProperty({
    description: 'Include role assignment history',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean = false;

  @ApiProperty({
    description: 'Include role permissions',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includePermissions?: boolean = false;

  @ApiProperty({
    description: 'Filter by specific roles',
    example: ['ADMIN', 'INVESTOR'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

/**
 * DTO for role assignment history entry
 */
export class RoleAssignmentHistoryDto {
  @ApiProperty({
    description: 'Assignment ID',
    example: 'assignment-uuid'
  })
  id: string;

  @ApiProperty({
    description: 'Role information',
    type: 'object'
  })
  role: {
    id: string;
    name: string;
    description?: string;
  };

  @ApiProperty({
    description: 'User who assigned the role',
    example: 'admin-user-id',
    nullable: true
  })
  assignedBy?: string;

  @ApiProperty({
    description: 'Assignment date',
    example: '2024-01-15T10:30:00Z'
  })
  assignedAt: string;

  @ApiProperty({
    description: 'Assignment reason',
    example: 'Initial role assignment'
  })
  reason?: string;

  @ApiProperty({
    description: 'Role expiration date',
    example: '2025-01-15T10:30:00Z',
    nullable: true
  })
  expiresAt?: string;

  @ApiProperty({
    description: 'Role revocation date',
    example: '2024-06-15T10:30:00Z',
    nullable: true
  })
  revokedAt?: string;

  @ApiProperty({
    description: 'User who revoked the role',
    example: 'admin-user-id',
    nullable: true
  })
  revokedBy?: string;

  @ApiProperty({
    description: 'Revocation reason',
    example: 'Role no longer needed',
    nullable: true
  })
  revokeReason?: string;

  @ApiProperty({
    description: 'Whether the assignment is currently active',
    example: true
  })
  isActive: boolean;
}