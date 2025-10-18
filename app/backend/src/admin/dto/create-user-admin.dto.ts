import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
  IsTimeZone,
  IsDefined,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for admin creating a new user with temporary password
 * Simpler than CreateUserDto - password is auto-generated, roles are auto-assigned
 */
export class CreateUserAdminDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'User timezone (IANA timezone identifier)',
    example: 'America/New_York',
    default: 'UTC',
    required: false,
  })
  @IsOptional()
  @IsTimeZone({ message: 'Timezone must be a valid IANA timezone' })
  timezone?: string;

  @ApiProperty({
    description: 'Email template ID to use for welcome email (defaults to USER_ACCOUNT_CREATED template)',
    example: 'clxxxxxxxxxxxxxxxxxx',
    required: false,
  })
  @IsOptional()
  @IsString()
  emailTemplateId?: string;
}
