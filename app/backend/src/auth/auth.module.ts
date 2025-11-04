import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          throttlers: [
            {
              name: 'default',
              ttl: configService.get<number>('THROTTLE_TTL', 60000),
              limit: configService.get<number>('THROTTLE_LIMIT', 100),
            },
            {
              name: 'short',
              ttl: 1000, // 1 second
              limit: 3,
            },
            {
              name: 'medium',
              ttl: 10000, // 10 seconds
              limit: 20,
            },
            {
              name: 'long',
              ttl: 60000, // 1 minute
              limit: 100,
            },
          ],
          // Using in-memory storage (default) for rate limiting
          // For production with multiple instances, consider Redis storage
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    PasswordService,
    JwtStrategy,
    JwtAuthGuard,
    PrismaService,
  ],
  exports: [
    AuthService,
    SessionService,
    PasswordService,
    JwtAuthGuard,
    PrismaService,
  ],
})
export class AuthModule {}
