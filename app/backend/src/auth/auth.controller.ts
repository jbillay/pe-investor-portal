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
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  LogoutDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
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
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 10 requests per 15 minutes
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
  @Throttle({ default: { limit: 20, ttl: 600000 } }) // 20 requests per 10 minutes
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
