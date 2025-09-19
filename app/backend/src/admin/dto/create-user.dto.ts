import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsEnum,
  IsPhoneNumber,
  IsTimeZone,
  IsISO31661Alpha2
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserLanguage {
  EN = 'en',
  FR = 'fr',
  DE = 'de',
  ES = 'es',
  IT = 'it',
  PT = 'pt',
  JA = 'ja',
  ZH = 'zh',
}

/**
 * DTO for creating a new user
 * Comprehensive validation for user registration
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email'
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 128
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 50
  })
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 50
  })
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

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
    default: 'UTC',
    required: false
  })
  @IsOptional()
  @IsTimeZone({ message: 'Timezone must be a valid IANA timezone' })
  timezone?: string;

  @ApiProperty({
    description: 'User preferred language',
    enum: UserLanguage,
    example: UserLanguage.EN,
    default: UserLanguage.EN,
    required: false
  })
  @IsOptional()
  @IsEnum(UserLanguage, { message: 'Language must be a valid language code' })
  language?: UserLanguage;

  @ApiProperty({
    description: 'Initial roles to assign to the user',
    example: ['INVESTOR', 'USER'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Whether the user should be activated immediately',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the user email should be marked as verified',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Additional user preferences as JSON object',
    example: { notifications: { email: true, sms: false }, theme: 'dark' },
    required: false,
    type: 'object'
  })
  @IsOptional()
  preferences?: Record<string, any>;

  @ApiProperty({
    description: 'Reason for creating this user (for audit purposes)',
    example: 'New investor registration',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}