import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  IsPhoneNumber,
  IsTimeZone,
  IsEnum,
  IsEmail
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateUserDto, UserLanguage } from './create-user.dto';

/**
 * DTO for updating user information
 * Extends CreateUserDto but makes all fields optional and excludes password
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'roles'] as const)
) {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Phone number must be a valid international phone number' })
  phone?: string;

  @ApiProperty({
    description: 'User timezone',
    example: 'America/New_York',
    required: false
  })
  @IsOptional()
  @IsTimeZone({ message: 'Timezone must be a valid IANA timezone' })
  timezone?: string;

  @ApiProperty({
    description: 'User preferred language',
    enum: UserLanguage,
    example: UserLanguage.EN,
    required: false
  })
  @IsOptional()
  @IsEnum(UserLanguage, { message: 'Language must be a valid language code' })
  language?: UserLanguage;

  @ApiProperty({
    description: 'User preferences as JSON object',
    example: { notifications: { email: true, sms: false }, theme: 'dark' },
    required: false
  })
  @IsOptional()
  preferences?: Record<string, any>;

  @ApiProperty({
    description: 'Reason for updating this user (for audit purposes)',
    example: 'Updated contact information',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}

/**
 * DTO for updating user status (activate/deactivate)
 */
export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Whether the user is active',
    example: true
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Reason for status change (for audit purposes)',
    example: 'User requested account deactivation',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}

/**
 * DTO for updating user verification status
 */
export class UpdateUserVerificationDto {
  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true
  })
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({
    description: 'Reason for verification change (for audit purposes)',
    example: 'Email verification completed',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}

/**
 * DTO for password reset operations
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'New temporary password (user will be forced to change on next login)',
    example: 'TempPass123!',
    minLength: 8
  })
  @IsString()
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  temporaryPassword: string;

  @ApiProperty({
    description: 'Whether to force password change on next login',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;

  @ApiProperty({
    description: 'Reason for password reset (for audit purposes)',
    example: 'User forgot password - admin reset',
    maxLength: 500
  })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}