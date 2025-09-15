# Claude.md - Project Development Guide

## Project Overview
This project is a multi-tenant enterprise application with secure document management and financial data handling capabilities. The architecture follows modern best practices with type safety, security, and scalability as core principles.

## Tech Stack Architecture

### Frontend Stack
- **Framework**: Vue.js 3 with Composition API
- **UI Framework**: PrimeVue components
- **Styling**: Tailwind CSS (utility-first, following Stripe's approach)
- **State Management**: Pinia for reactive state management
- **Type Safety**: TypeScript throughout
- **Build Tool**: Vite for fast development and optimized builds
- **Router**: Vue Router 4 with route guards

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS (enterprise-grade with dependency injection)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT + refresh token rotation
- **Caching**: Redis for session management and caching
- **Queue Management**: Bull for background jobs (optional)
- **API Documentation**: Swagger/OpenAPI auto-generation

### Security & Multi-tenancy
- **Data Isolation**: Row-Level Security (RLS) in PostgreSQL
- **Authentication**: JWT tokens with secure refresh rotation
- **Document Security**: Presigned URLs for secure access
- **Configuration**: Environment variables + database-stored preferences
- **Rate Limiting**: Express-rate-limit with Redis store
- **Input Sanitization**: DOMPurify for XSS prevention
- **CSRF Protection**: Double-submit cookie pattern

### Development & Deployment
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm (with lockfile)
- **Code Quality**: ESLint + Prettier + Husky + lint-staged
- **Testing**: Jest (unit/integration) + Cypress (E2E)
- **Document Viewing**: PDF.js for in-browser rendering
- **CI/CD**: GitHub Actions / GitLab CI (specify your choice)
- **Monitoring**: Sentry for error tracking (production)

## Development Guidelines

### Code Standards
- Use TypeScript strict mode throughout the stack
- Follow functional programming patterns where possible
- Implement proper error handling with typed exceptions
- Use async/await over Promises for better readability
- Apply SOLID principles, especially in NestJS services
- Maximum file length: 300 lines (split into smaller modules)
- Use named exports over default exports for better refactoring

### Naming Conventions
- **Files**: kebab-case (e.g., `user-service.ts`)
- **Vue Components**: PascalCase (e.g., `UserProfile.vue`)
- **Classes/Interfaces**: PascalCase (e.g., `UserDto`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Database Tables**: snake_case (e.g., `user_profiles`)
- **API Routes**: kebab-case (e.g., `/api/user-profiles`)

### Database Patterns
- Always use Prisma schema for database changes
- Implement proper migrations for schema updates
- Index frequently queried fields
- Use transactions for complex operations
- Implement soft deletes for audit trails
- Use UUID v4 for primary keys (better for distributed systems)
- Add `created_at`, `updated_at` timestamps to all tables
- Implement optimistic locking for concurrent updates

### API Design
- Follow RESTful principles with proper HTTP status codes
- Implement proper request validation using class-validator
- Use DTOs for request/response typing
- Apply rate limiting and request size limits
- Document APIs with Swagger/OpenAPI
- Version APIs properly (e.g., `/api/v1/`)
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Implement pagination with cursor-based approach for large datasets
- Return consistent error response format:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "details": {}
    }
  }
  ```

### Security Best Practices
- Validate all inputs on both client and server
- Implement proper CORS configuration
- Use HTTPS in all environments except local development
- Store sensitive data using proper encryption (AES-256)
- Implement proper session management with Redis
- Use bcrypt for password hashing (min 10 rounds)
- Implement 2FA for sensitive operations
- Regular security dependency audits (`npm audit`)
- Implement Content Security Policy (CSP) headers
- Use environment-specific secrets management

### Frontend Patterns
- Use Vue 3 Composition API consistently
- Implement proper component composition for UI elements
- Use Pinia stores for shared state
- Apply Tailwind utility classes following atomic design
- Implement proper form validation with VeeValidate
- Use `<script setup>` syntax for cleaner components
- Implement proper loading states and error boundaries
- Use Suspense for async component loading
- Implement proper TypeScript generics for reusable components
- Follow Vue 3 best practices:
  ```vue
  <template>
    <!-- Template here -->
  </template>

  <script setup lang="ts">
  // Composition API logic
  </script>

  <style scoped>
  /* Scoped styles if needed */
  </style>
  ```

### Testing Strategy
- Write unit tests for business logic (min 80% coverage)
- Implement integration tests for API endpoints
- Use Jest with proper mocking for external services
- Test authentication flows thoroughly
- Implement E2E tests for critical user journeys
- Use factory patterns for test data generation
- Mock external services properly
- Test error scenarios and edge cases
- Performance testing for critical endpoints

### Performance Guidelines
- Implement proper database query optimization
- Use database connection pooling
- Implement Redis caching for frequently accessed data
- Use CDN for static assets
- Implement lazy loading for Vue routes
- Use virtual scrolling for large lists
- Optimize images (WebP format, responsive sizes)
- Implement proper API response compression (gzip/brotli)
- Monitor Core Web Vitals (LCP, FID, CLS)

## File Structure Conventions

```
project-root/
├── apps/
│   ├── frontend/           # Vue.js application
│   │   ├── src/
│   │   │   ├── components/ # Reusable Vue components
│   │   │   │   ├── common/ # Generic components
│   │   │   │   └── domain/ # Business-specific components
│   │   │   ├── views/      # Page components
│   │   │   ├── layouts/    # Layout components
│   │   │   ├── stores/     # Pinia stores
│   │   │   ├── composables/# Vue composables
│   │   │   ├── services/   # API service layer
│   │   │   ├── utils/      # Utility functions
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   └── assets/     # Static assets
│   │   ├── tests/
│   │   │   ├── unit/       # Unit tests
│   │   │   └── e2e/        # End-to-end tests
│   │   └── ...
│   └── backend/            # NestJS application
│       ├── src/
│       │   ├── modules/    # Feature modules
│       │   │   └── [module]/
│       │   │       ├── dto/        # Data Transfer Objects
│       │   │       ├── entities/   # Domain entities
│       │   │       ├── controllers/# HTTP controllers
│       │   │       ├── services/   # Business logic
│       │   │       └── tests/      # Module tests
│       │   ├── common/     # Shared utilities
│       │   │   ├── decorators/    # Custom decorators
│       │   │   ├── filters/       # Exception filters
│       │   │   ├── guards/        # Auth guards
│       │   │   ├── interceptors/  # Request interceptors
│       │   │   └── pipes/         # Validation pipes
│       │   ├── config/     # Configuration management
│       │   ├── database/   # Database utilities
│       │   │   └── prisma/ # Prisma schema and migrations
│       │   └── types/      # Global TypeScript definitions
│       ├── tests/
│       │   ├── unit/       # Unit tests
│       │   └── integration/# Integration tests
│       └── ...
├── packages/
│   ├── shared/             # Shared types and utilities
│   ├── eslint-config/      # Shared ESLint configuration
│   └── tsconfig/           # Shared TypeScript configuration
├── docker/                 # Docker configuration
│   ├── development/        # Dev environment setup
│   └── production/         # Production setup
├── scripts/                # Build and deployment scripts
├── docs/                   # Project documentation
│   ├── api/               # API documentation
│   ├── architecture/      # Architecture decisions (ADRs)
│   └── guides/            # Development guides
└── .github/               # GitHub Actions workflows
```

## Common Commands

### Development Setup
```bash
# Initial setup
npm install
cp .env.example .env  # Configure environment variables

# Start development environment
docker-compose up -d  # Database and Redis
npm run dev          # Start both frontend and backend

# Database operations
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed development data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (caution!)

# Code generation
npm run prisma:generate  # Generate Prisma client
npm run openapi:generate # Generate API client types
```

### Code Quality
```bash
# Linting and formatting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Run Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript validation

# Testing
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests only
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Security
npm audit           # Check for vulnerabilities
npm audit fix       # Auto-fix vulnerabilities
```

### Build & Deployment
```bash
# Build
npm run build        # Build all applications
npm run build:frontend # Build frontend only
npm run build:backend  # Build backend only

# Docker
docker-compose build # Build Docker images
docker-compose up    # Start all services
docker-compose down  # Stop all services

# Production
npm run start:prod   # Start production server
npm run migrate:prod # Run production migrations
```

## Key Implementation Patterns

### Authentication Flow
```typescript
// 1. User login request
// 2. Validate credentials
// 3. Generate JWT + Refresh token
// 4. Store refresh token in Redis
// 5. Return tokens to client
// 6. Client stores in httpOnly cookies
// 7. Include JWT in Authorization header
// 8. Validate JWT on each request
// 9. Refresh when expired
```

### Document Management
- Generate presigned URLs for secure upload/download
- Implement virus scanning for uploaded files (ClamAV)
- Use PDF.js for secure in-browser viewing
- Store document metadata in PostgreSQL
- Implement document versioning
- Support multiple file formats with proper MIME validation
- Implement file size limits (configurable per tenant)
- Use S3-compatible storage for scalability

### Multi-tenant Data Access Pattern
```typescript
// Always filter by tenant ID
const result = await prisma.resource.findMany({
  where: {
    tenantId: context.tenantId,
    ...otherFilters
  }
});

// Use Prisma middleware for automatic tenant filtering
prisma.$use(async (params, next) => {
  // Add tenant filter logic
  return next(params);
});
```

### Error Handling
```typescript
// Custom exception example
export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super({ message, errorCode }, statusCode);
  }
}

// Global error filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Structured error logging
    // User-friendly error response
  }
}
```

### Performance Optimization
- Implement proper database indexing
- Use lazy loading for Vue components
- Apply pagination for large data sets
- Implement request/response caching
- Use database query optimization (EXPLAIN ANALYZE)
- Implement CDN for static assets
- Use WebSocket for real-time features
- Implement job queues for heavy operations

## Troubleshooting Guide

### Common Issues
1. **Database Connection Issues**
   - Check PostgreSQL container is running
   - Verify connection string in .env
   - Check network connectivity

2. **Authentication Failures**
   - Verify JWT secret is set
   - Check token expiration settings
   - Ensure Redis is running for sessions

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify TypeScript configuration

4. **Performance Issues**
   - Check database query performance
   - Review N+1 query problems
   - Verify caching is working
   - Check for memory leaks

## When Helping with Code

### Always Consider
1. **Type Safety**: Ensure all code is properly typed with no `any` types
2. **Security**: Validate inputs and implement proper authorization
3. **Error Handling**: Implement comprehensive error handling with logging
4. **Testing**: Suggest testable code patterns and include test examples
5. **Performance**: Consider optimization opportunities and scalability
6. **Documentation**: Include JSDoc comments for complex functions
7. **Accessibility**: Ensure UI components are WCAG compliant

### Code Review Checklist
- [ ] TypeScript types are properly defined (no `any`)
- [ ] Authentication/authorization is implemented
- [ ] Input validation is comprehensive
- [ ] Error handling covers all scenarios
- [ ] Database queries are optimized (no N+1)
- [ ] Security best practices are followed
- [ ] Code follows established patterns
- [ ] Tests are included for new functionality
- [ ] Documentation is updated
- [ ] Performance impact is considered
- [ ] Accessibility requirements are met
- [ ] Code passes linting and formatting

### Common Solutions
- **Database Queries**: Always use Prisma with proper typing and optimization
- **Authentication**: Leverage NextAuth.js patterns with proper guards
- **State Management**: Use Pinia with proper TypeScript integration
- **Styling**: Apply Tailwind utilities following atomic design principles
- **API Endpoints**: Follow NestJS controller/service/repository pattern
- **Form Handling**: Use VeeValidate with Zod schema validation
- **Real-time Updates**: Implement WebSocket with proper authentication
- **File Uploads**: Use multer with proper validation and virus scanning
- **Background Jobs**: Use Bull queues for async operations
- **Caching**: Implement Redis caching with proper TTL strategies

## Additional Resources
- [Vue 3 Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OWASP Security Guidelines](https://owasp.org/)

This guide should be referenced for all development decisions and code assistance to maintain consistency and quality across the project. Update this document as patterns evolve and new decisions are made.