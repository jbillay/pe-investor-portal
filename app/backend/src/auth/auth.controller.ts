import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  LogoutDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { SetPasswordDto, SetPasswordResponseDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordService: PasswordService,
  ) {}

  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email and password.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts',
  })
  @ApiBody({ type: RegisterDto })
  @Public()
  @Post('register')
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'test' ? 500 : 5,
      ttl: process.env.NODE_ENV === 'test' ? 60000 : 300000
    }
  }) // Test: 500/min, Production: 5/5min
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    return this.authService.register(registerDto, userAgent, ipAddress);
  }

  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns JWT tokens for API access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts',
  })
  @ApiBody({ type: LoginDto })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
      ttl: process.env.NODE_ENV === 'test' ? 60000 : 900000
    }
  }) // Test: 1000/min, Production: 10/15min
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get a new access token using a valid refresh token. The old refresh token will be revoked.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many refresh attempts',
  })
  @ApiBody({ type: RefreshTokenDto })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'test' ? 2000 : 20,
      ttl: process.env.NODE_ENV === 'test' ? 60000 : 600000
    }
  }) // Test: 2000/min, Production: 20/10min
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      userAgent,
      ipAddress,
    );
  }

  @ApiOperation({
    summary: 'User logout',
    description:
      'Revoke a specific refresh token and invalidate the user session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: LogoutDto })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() logoutDto: LogoutDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    await this.authService.logout(logoutDto.refreshToken, userAgent, ipAddress);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Revoke all refresh tokens for the current user, effectively logging them out from all devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout from all devices successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out from all devices successfully',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiBearerAuth('JWT-auth')
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.get('User-Agent');
    const ipAddress = this.getClientIp(req);

    await this.authService.logoutAll(user.id, userAgent, ipAddress);
    return { message: 'Logged out from all devices successfully' };
  }

  @ApiOperation({
    summary: 'Get user profile',
    description: "Retrieve the authenticated user's profile information.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cljk0x5a10001qz6z9k8z9k8z' },
        email: { type: 'string', example: 'john.doe@example.com' },
        firstName: { type: 'string', example: 'John', nullable: true },
        lastName: { type: 'string', example: 'Doe', nullable: true },
        isActive: { type: 'boolean', example: true },
        isVerified: { type: 'boolean', example: true },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    isVerified: boolean;
  }> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };
  }

  @ApiOperation({
    summary: 'Validate JWT token',
    description:
      'Validate the current JWT token and return user information if valid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cljk0x5a10001qz6z9k8z9k8z' },
            email: { type: 'string', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John', nullable: true },
            lastName: { type: 'string', example: 'Doe', nullable: true },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ valid: boolean; user: AuthenticatedUser }> {
    return {
      valid: true,
      user,
    };
  }

  @ApiOperation({
    summary: 'Set permanent password',
    description: `
      Set a permanent password after logging in with a temporary password.
      This endpoint is used when a user has been created by an admin with a temporary password.

      Requirements:
      - User must be authenticated with temporary password
      - Temporary password must not be expired (72-hour validity)
      - New password must meet security requirements:
        - Minimum 12 characters (industry best practice)
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character
        - Cannot be the same as temporary password
        - Cannot contain user's email

      After successful password change:
      - All existing sessions are revoked
      - New JWT tokens are generated
      - User is marked as verified
      - Audit log entry is created
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Password set successfully, returns new tokens',
    type: SetPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or password validation failed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password validation failed' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Password must be at least 12 characters long',
            'Password must contain at least one uppercase letter',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid temporary password',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 410,
    description: 'Temporary password has expired',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many password change attempts',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: SetPasswordDto })
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
  async setPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() setPasswordDto: SetPasswordDto,
  ): Promise<SetPasswordResponseDto> {
    return this.passwordService.setPassword(user.id, setPasswordDto);
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string)?.trim() ||
      req.connection?.remoteAddress?.trim() ||
      req.socket?.remoteAddress?.trim() ||
      'unknown'
    );
  }
}
