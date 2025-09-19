import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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
