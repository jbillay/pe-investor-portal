import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO when admin creates a user with temporary password
 * Returns user info and temporary password (only returned once!)
 */
export class CreateUserResponseDto {
  @ApiProperty({
    description: 'Created user ID',
    example: 'clxxxxxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Temporary password for first login (ONLY returned once!)',
    example: 'aBc2dEf3gHjK4mNp5qRs',
  })
  tempPassword: string;

  @ApiProperty({
    description: 'When the temporary password expires (ISO 8601 format)',
    example: '2025-10-16T12:00:00.000Z',
  })
  tempPasswordExpiresAt: Date;

  @ApiProperty({
    description: 'Assigned roles',
    example: ['INVESTOR', 'USER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'User timezone',
    example: 'America/New_York',
  })
  timezone: string;

  @ApiProperty({
    description: 'Whether welcome email was sent successfully',
    example: true,
  })
  emailSent: boolean;

  @ApiProperty({
    description: 'Email send error message if failed',
    example: 'SMTP connection error',
    required: false,
  })
  emailError?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2025-10-13T12:00:00.000Z',
  })
  createdAt: Date;
}
