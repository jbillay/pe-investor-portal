import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { PASSWORD_REQUIREMENTS } from '../../common/constants/password.constants';

/**
 * DTO for setting a new permanent password
 * Used when user logs in with temporary password
 */
export class SetPasswordDto {
  @ApiProperty({
    description: 'Current temporary password',
    example: 'aBc2dEf3gHjK4mNp5qRs',
  })
  @IsString()
  tempPassword: string;

  @ApiProperty({
    description: `New password (min ${PASSWORD_REQUIREMENTS.MIN_LENGTH} chars, must contain uppercase, lowercase, number, and special character)`,
    example: 'MyNewSecurePass123!',
    minLength: PASSWORD_REQUIREMENTS.MIN_LENGTH,
    maxLength: PASSWORD_REQUIREMENTS.MAX_LENGTH,
  })
  @IsString()
  @MinLength(PASSWORD_REQUIREMENTS.MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
  })
  @MaxLength(PASSWORD_REQUIREMENTS.MAX_LENGTH, {
    message: `Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`,
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of new password (must match newPassword)',
    example: 'MyNewSecurePass123!',
  })
  @IsString()
  confirmPassword: string;
}

/**
 * Response DTO after successfully setting password
 */
export class SetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password set successfully',
  })
  message: string;

  @ApiProperty({
    description: 'New access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}
