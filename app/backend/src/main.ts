import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { csrfTokenGenerator } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: HTTP security headers with helmet
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Swagger UI
            'https://fonts.googleapis.com',
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Swagger UI in development
            ...(isProduction ? [] : ["'unsafe-eval'"]), // Only in development for Swagger
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          connectSrc: [
            "'self'",
            configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
            'http://localhost:5173',
            'http://localhost:3000',
          ],
          frameSrc: ["'none'"], // Prevent clickjacking
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null, // Force HTTPS in production
        },
      },
      // Strict Transport Security (HSTS) - Force HTTPS
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Prevent MIME sniffing
      noSniff: true,
      // Clickjacking protection
      frameguard: {
        action: 'deny',
      },
      // Hide X-Powered-By header
      hidePoweredBy: true,
      // XSS Protection (legacy browsers)
      xssFilter: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  logger.log('🛡️  Security headers configured with helmet.js');

  // Security: Request size limits to prevent DoS attacks
  const maxJsonSize = configService.get<string>('MAX_JSON_SIZE', '10mb');
  const maxFileSize = configService.get<string>('MAX_FILE_SIZE', '50mb');

  app.use(express.json({ limit: maxJsonSize }));
  app.use(express.urlencoded({ extended: true, limit: maxJsonSize }));
  app.use(express.raw({ limit: maxFileSize })); // For raw payloads (webhooks, binary data)

  logger.log(
    `🔒 Request size limits configured (JSON: ${maxJsonSize}, Files: ${maxFileSize})`,
  );

  // Security: Cookie parser - required for CSRF protection
  app.use(cookieParser());
  logger.log('🍪 Cookie parser configured');

  // Security: CSRF protection - generate token middleware
  // This makes req.csrfToken() available for generating tokens
  app.use(csrfTokenGenerator);

  logger.log('🛡️  CSRF protection enabled (Double Submit Cookie Pattern)');


  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not in DTO
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('PE Investor Portal API')
    .setDescription(
      'Comprehensive API documentation for the Private Equity Investor Portal backend service',
    )
    .setVersion('1.0.0')
    .setContact(
      'Development Team',
      'https://github.com/your-org/pe-investor-portal',
      'dev@pe-portal.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:5173', 'Development Server')
    .addServer('https://api.pe-portal.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('Authentication', 'User authentication and session management')
    .addTag('Role Management', 'Role-based access control operations')
    .addTag('RBAC Setup', 'Initiate the role & permission - to be used only once')
    .addTag('Permission Management', 'Permission management and assignment')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'PE Investor Portal API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; border-radius: 5px; }
    `,
  });

  const port = configService.get<number>('APP_PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🏥 Health check available at: http://localhost:${port}/health`);
  logger.log(
    `🔐 Auth endpoints available at: http://localhost:${port}/api/auth`,
  );
  logger.log(
    `👤 User management endpoints available at: http://localhost:${port}/api/admin/users`,
  );
  logger.log(
    `👑 Role management endpoints available at: http://localhost:${port}/api/admin/roles`,
  );
  logger.log(
    `🔒 Permission management endpoints available at: http://localhost:${port}/api/admin/permissions`,
  );
  logger.log(
    `⚙️ RBAC setup endpoints available at: http://localhost:${port}/api/admin/rbac-setup`,
  );
  logger.log(
    `🔗 User role management endpoints available at: http://localhost:${port}/api/admin/user-roles`,
  );
  logger.log(
    `📚 API documentation available at: http://localhost:${port}/api-docs`,
  );
}
bootstrap();
