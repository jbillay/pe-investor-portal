# Claude.md - Project Development Guide

## Project Overview
The investor portal is a secure web application that gives fund investors direct access to information about their commitments, capital calls, distributions, reimbursements, and the fund’s overall activity.
It also serves as a central repository for key documents such as fund regulations, subscription orders, audited financial statements, tax forms, legal agreements and amendments, investor notices, meeting minutes, and ESG or impact reports, providing controlled, encrypted access to all essential data and communications.

Core functions should include
- **Account access**: authentication, role-based permissions, multi-factor security.
- **Capital activity**: view commitments, capital calls, distributions, unfunded amounts, transaction history, downloadable notices.
- **Performance reporting**: net asset value, IRR, multiples, historical valuations, benchmark comparisons, downloadable statements.
- **Documents**: central repository for fund regulations, subscription agreements and orders, audited financial statements, tax forms, legal agreements and amendments, investor notices, meeting minutes, and ESG or impact reports, with version control and search.
- **Communications**: announcements, messaging, automated alerts for new documents or calls/distributions.
- **Analytics and dashboards**: charts of portfolio composition, sector exposure, ESG metrics when offered.
- **Data integration**: feeds from fund accounting, CRM, and reporting systems; export in Excel, CSV, PDF, or via API.

## Tech Stack Architecture

### Frontend Stack
- **Framework**: Vue.js 3 with Composition API
- **UI Framework**: PrimeVue v4 components
- **Styling**: Tailwind CSS (utility-first, following Stripe's approach)
- **State Management**: Pinia for reactive state management
- **Type Safety**: TypeScript throughout
- **Build Tool**: Vite for fast development and optimized builds
- **Router**: Vue Router 4 with route guards

### Backend Stack
- **Runtime**: Node.js 22.x with TypeScript 5.8
- **Framework**: NestJS 11.0 (enterprise-grade with dependency injection)
- **Database**: PostgreSQL 15 with Prisma ORM 6.16
- **Authentication**: JWT + Passport.js with custom refresh token rotation
- **Caching**: Redis 7 for session management and caching
- **Email**: Nodemailer 7.0 with Mustache templating + database queue with retry logic
- **Queue Management**: Database-backed email queue (Bull not currently used)
- **API Documentation**: Swagger/OpenAPI auto-generation with @nestjs/swagger
- **Validation**: class-validator + class-transformer for DTO validation
- **Rate Limiting**: @nestjs/throttler with Redis store and IP-based throttling

### Security & Multi-tenancy
- **Data Isolation**: Row-Level Security (RLS) in PostgreSQL
- **Authentication**: JWT tokens with secure refresh rotation
- **Document Security**: Presigned URLs for secure access
- **Configuration**: Environment variables + database-stored preferences
- **Rate Limiting**: Express-rate-limit with Redis store
- **Input Sanitization**: DOMPurify for XSS prevention
- **CSRF Protection**: Double-submit cookie pattern

### Development & Deployment
- **Containerization**: Docker + Docker Compose (13 services including PostgreSQL, Redis, MailHog, pgAdmin, Redis Commander)
- **Package Manager**: pnpm 8.0+ with workspace configuration (monorepo)
- **Code Quality**: ESLint 9.31/8.50 + Prettier 3.6/3.4 + Husky 8.0 + lint-staged 14.0
- **Testing**:
  - Backend: Jest 30.0 (64 test files, 80% coverage minimum)
  - Frontend: Vitest 3.2 + Playwright 1.54 (88 test files, 80% coverage minimum)
- **Document Viewing**: PDF.js for in-browser rendering
- **CI/CD**: GitHub Actions with automated coverage badges, Codecov integration, and auto-merge
- **Development Tools**: MailHog for email testing, pgAdmin for database management, Redis Commander for cache inspection

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
├── app/                    # Applications directory (singular)
│   ├── frontend/           # Vue.js application
│   │   ├── src/
│   │   │   ├── components/ # Reusable Vue components (69 total)
│   │   │   │   ├── admin/  # Admin-specific components
│   │   │   │   ├── dynamic/# Dynamic form/table components
│   │   │   │   │   ├── cells/   # Table cell renderers
│   │   │   │   │   └── fields/  # Form field types
│   │   │   │   └── layout/ # Layout components
│   │   │   ├── views/      # Page components (18 views)
│   │   │   │   ├── admin/  # Admin views (7 views)
│   │   │   │   │   ├── UserManagementView.vue
│   │   │   │   │   ├── RoleManagementView.vue
│   │   │   │   │   ├── DataObjectManagerView.vue
│   │   │   │   │   ├── DataObjectEditorView.vue
│   │   │   │   │   ├── EmailTemplateManagementView.vue
│   │   │   │   │   ├── PluginManagementView.vue
│   │   │   │   │   └── AnalyticsView.vue
│   │   │   │   └── auth/   # Authentication views
│   │   │   ├── stores/     # Pinia stores (2 stores)
│   │   │   │   ├── auth.ts           # Authentication state management
│   │   │   │   └── pluginRegistry.ts # Plugin registry
│   │   │   ├── composables/# Vue composables (22 composables)
│   │   │   │   ├── useApi.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useCsrf.ts
│   │   │   │   ├── useAuditTrail.ts
│   │   │   │   ├── useRoles.ts
│   │   │   │   ├── admin/      # Admin composables
│   │   │   │   └── dynamic/    # Dynamic data composables
│   │   │   ├── services/   # API service layer (7 services)
│   │   │   │   ├── api.ts
│   │   │   │   ├── auditTrailService.ts
│   │   │   │   ├── emailApiService.ts
│   │   │   │   ├── pluginApiService.ts
│   │   │   │   └── roleApiService.ts
│   │   │   ├── router/     # Vue Router with lazy loading
│   │   │   ├── utils/      # Utility functions
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   └── assets/     # Static assets
│   │   ├── test/           # Test setup and fixtures
│   │   │   ├── unit/       # Unit tests (Vitest)
│   │   │   └── e2e/        # End-to-end tests (Playwright)
│   │   └── ...
│   └── backend/            # NestJS application
│       ├── src/
│       │   ├── admin/      # Admin & RBAC module
│       │   │   ├── controllers/   # 7 controllers (users, roles, permissions, etc.)
│       │   │   ├── services/      # Admin business logic
│       │   │   ├── guards/        # Authorization guards
│       │   │   ├── decorators/    # Custom decorators (@RequirePermissions)
│       │   │   └── dto/           # Data Transfer Objects
│       │   ├── auth/       # Authentication module
│       │   │   ├── auth.controller.ts
│       │   │   ├── services/      # Auth, password, session services
│       │   │   ├── strategies/    # Passport JWT strategy
│       │   │   ├── guards/        # JWT auth guard
│       │   │   ├── decorators/    # Auth decorators
│       │   │   └── dto/           # Login, register DTOs
│       │   ├── email/      # Email system module
│       │   │   ├── controllers/   # Email & template controllers
│       │   │   ├── services/      # 5 services (queue, templates, rendering, caching, SMTP)
│       │   │   ├── jobs/          # Background email jobs
│       │   │   └── dto/           # Email DTOs
│       │   ├── plugin/     # Plugin system module
│       │   │   ├── controllers/   # Plugin & file controllers
│       │   │   ├── services/      # Plugin management services
│       │   │   └── dto/           # Plugin DTOs
│       │   ├── dynamic-data/# Dynamic data CRUD module
│       │   │   ├── controllers/   # Dynamic & instance controllers
│       │   │   ├── services/      # Dynamic data services
│       │   │   ├── guards/        # Permission guards
│       │   │   └── entities/      # Data entities
│       │   ├── data-objects/# Data object definitions module
│       │   │   ├── controllers/   # Data object controller
│       │   │   ├── services/      # Object, field, versioning services
│       │   │   └── dto/           # Object definition DTOs
│       │   ├── common/     # Shared utilities
│       │   │   ├── guards/        # IP throttler guard
│       │   │   ├── middleware/    # Security, logging, CSRF middleware
│       │   │   ├── decorators/    # Custom decorators
│       │   │   ├── pipes/         # Validation pipes
│       │   │   ├── services/      # Audit logger, sanitization services
│       │   │   └── prisma/        # Prisma service integration
│       │   ├── health/     # Health check module
│       │   ├── config/     # Configuration management
│       │   └── database/   # Database utilities
│       │       └── prisma/ # Prisma schema (542 lines, 20+ models) and migrations (11 migrations)
│       ├── test/           # Test setup
│       │   ├── factories/  # Test data factories
│       │   ├── fixtures/   # Test fixtures
│       │   └── mocks/      # Service mocks
│       └── ...
├── docker/                 # Docker configuration
│   ├── backend.Dockerfile  # Multi-stage backend build
│   ├── frontend.Dockerfile # Frontend build + Nginx
│   └── docker-compose.yml  # 13 services (PostgreSQL, Redis, MailHog, etc.)
├── sample-plugins/         # Example plugin for reference
│   └── hello-world/        # Sample plugin with plugin.json manifest
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
# Initial setup (using pnpm)
pnpm install
cp .env.example .env  # Configure environment variables

# Start development environment
docker-compose up -d  # Database, Redis, MailHog, pgAdmin, Redis Commander
pnpm run dev         # Start both frontend and backend
# Note: Frontend runs on port 3000, Backend API on port 5173 (docker)

# Database operations
pnpm run db:migrate   # Run Prisma migrations
pnpm run db:seed      # Seed development data
pnpm run db:studio    # Open Prisma Studio
pnpm run db:reset     # Reset database (caution!)

# Code generation
pnpm run prisma:generate  # Generate Prisma client
pnpm run openapi:generate # Generate API client types (if configured)

# Access development tools
# - API Documentation: http://localhost:5173/api-docs
# - MailHog (email testing): http://localhost:8025
# - pgAdmin: http://localhost:8080
# - Redis Commander: http://localhost:8081
```

### Code Quality
```bash
# Linting and formatting
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint issues
pnpm run format       # Run Prettier
pnpm run format:check # Check formatting
pnpm run type-check   # TypeScript validation

# Testing
pnpm run test         # Run all tests
pnpm run test:unit    # Unit tests only
pnpm run test:e2e     # E2E tests only (Playwright)
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Generate coverage report (80% minimum enforced)

# Backend has 64 test files, Frontend has 88 test files
# Coverage reports generated in coverage/ directories

# Security
pnpm audit           # Check for vulnerabilities
pnpm audit fix       # Auto-fix vulnerabilities
```

### Build & Deployment
```bash
# Build
pnpm run build        # Build all applications
pnpm run build:frontend # Build frontend only
pnpm run build:backend  # Build backend only

# Docker
docker-compose build # Build Docker images
docker-compose up    # Start all services
docker-compose down  # Stop all services
docker-compose --profile development up  # Development profile
docker-compose --profile monitoring up   # With monitoring tools

# Production
pnpm run start:prod   # Start production server
pnpm run migrate:prod # Run production migrations
```

## Database Models & Schema

The application uses Prisma ORM with PostgreSQL and has 20+ models organized into functional groups:

### Core User & Authentication Models
- **User**: User accounts with email, hashed passwords, temporary passwords with expiration
- **UserProfile**: Extended user information (avatar, preferences, timezone, language)
- **Session**: Refresh token management with token hashes and expiry tracking
- **AuditLog**: Comprehensive audit trails for security events

### RBAC (Role-Based Access Control) Models
- **Role**: Role definitions with default role support and system role flags
- **Permission**: Granular permission definitions (resource + action + scope)
- **UserRole**: Many-to-many mapping between users and roles
- **RolePermission**: Many-to-many mapping between roles and permissions
- **RoleAssignment**: Time-limited role assignments with expiration and revocation tracking

### Email System Models
- **EmailTemplate**: Mustache-based templates with variable schemas and versioning
- **EmailLog**: Sent email history with tracking (status, timestamps, metadata)
- **EmailQueue**: Asynchronous email queue with retry logic (max 3 attempts)
- **EmailCategory**: Enum (ACCOUNT, DOCUMENT, CAPITAL_CALL, DISTRIBUTION, SYSTEM)

### Plugin System Models
- **Plugin**: Plugin metadata with semantic versioning, manifests, and dependencies
- **PluginStatus**: Enum (UPLOADED, INSTALLED, FAILED, UNINSTALLED)
- Includes audit fields for installation/uninstallation tracking

### Dynamic Data System Models (EAV Pattern)
- **DataObject**: Custom entity definitions created by admins
- **DataObjectVersion**: Schema versioning for backward compatibility
- **DataField**: Field definitions with 13 supported types
- **FieldValidationRule**: Custom validation rules per field
- **FieldDropdownOption**: Dropdown choices for select fields
- **DataObjectInstance**: User-created instances of data objects
- **InstanceFieldValue**: EAV storage for field values (multiple columns for different data types)
- **InstanceChangeLog**: Complete audit trail of changes with before/after values

### Supported Field Types
13 field types supported in dynamic data objects:
- TEXT, TEXTAREA, NUMBER, CURRENCY
- DATE, DATETIME, BOOLEAN
- SINGLE_SELECT, MULTI_SELECT
- EMAIL, URL, FILE, RICH_TEXT
- RELATIONSHIP (for linking data objects)

## Key Implementation Patterns

### Authentication Flow (Custom JWT + Passport.js)
```typescript
// 1. User login request with credentials
// 2. Validate credentials with bcrypt (12 rounds)
// 3. Generate JWT access token + refresh token
// 4. Store refresh token hash in Session table
// 5. Return both tokens to client
// 6. Client stores tokens (access token in memory/localStorage, refresh in httpOnly cookie)
// 7. Include JWT in Authorization: Bearer header
// 8. Validate JWT on each request via Passport JWT strategy
// 9. Auto-refresh when expired (5-second cooldown, max 3 retries)
// 10. Track session in Redis for fast invalidation
// 11. Audit all auth events in AuditLog table

// Temporary Password System:
// - Generate temporary password on user creation
// - Set expiration (configurable, e.g., 24 hours)
// - Force password change on first login
// - Track temporary password usage in audit log
```

### Document Management
- Generate presigned URLs for secure upload/download
- Implement virus scanning for uploaded files (ClamAV - planned)
- Use PDF.js for secure in-browser viewing
- Store document metadata in PostgreSQL
- Implement document versioning
- Support multiple file formats with proper MIME validation
- Implement file size limits (configurable per tenant)
- Use S3-compatible storage for scalability (planned)
- File upload support in dynamic data objects with FILE field type

### Plugin System Implementation
```typescript
// Plugin Architecture:
// 1. Admin uploads ZIP file via PluginManagementView
// 2. Backend extracts and validates plugin.json manifest
// 3. Manifest validation:
//    - name, version (semver), description, author
//    - entry point (e.g., index.js)
//    - optional dependencies, permissions
// 4. Plugin status set to UPLOADED
// 5. Admin installs plugin → status changes to INSTALLED
// 6. Plugin files served from uploads/plugins/{pluginId}/
// 7. Frontend loads plugin via dynamic script injection
// 8. Plugin context injected to window with host app APIs
// 9. Plugins can access toast notifications, routing, etc.
// 10. Audit trail tracks who installed/uninstalled when

// Plugin Registry (Frontend):
// - Pinia store manages loaded plugins
// - Dynamic component registration
// - Sandboxed execution context
// - Sample plugin: hello-world in sample-plugins/
```

### Dynamic Data Objects System (EAV Pattern)
```typescript
// Admin Workflow:
// 1. Admin creates DataObject via DataObjectEditorView
//    - Define object name, description, icon
//    - Add fields with types, labels, validation rules
//    - Configure dropdown options for select fields
//    - Set up relationships between objects
// 2. System creates DataObjectVersion for schema versioning
// 3. Fields stored in DataField table with validation rules
// 4. Changes published → users can create instances

// User Workflow:
// 1. Users access DynamicListView to see all instances
// 2. Create new instance via DynamicFormView
// 3. Data stored in InstanceFieldValue (EAV pattern):
//    - Multiple storage columns: textValue, numberValue, dateValue, etc.
//    - Efficient querying with proper indexing
// 4. All changes tracked in InstanceChangeLog
// 5. View/edit via DynamicDetailView

// EAV Storage Pattern:
// - Single InstanceFieldValue table stores all field data
// - Type-specific columns for optimal storage
// - Relationships supported via relationshipTargetId
// - Full audit trail with before/after snapshots
```

### Email System Implementation
```typescript
// 5-Service Architecture:
// 1. EmailService: High-level email operations
// 2. EmailQueueService: Async queue with retry logic (max 3)
// 3. EmailTemplateService: Template CRUD operations
// 4. TemplateRendererService: Mustache rendering with variables
// 5. TemplateCacheService: In-memory template caching

// Email Flow:
// 1. Admin creates EmailTemplate with Mustache variables
// 2. Template stored with variable schema validation
// 3. App triggers email send with template ID + variables
// 4. Email added to EmailQueue with PENDING status
// 5. Background job processes queue
// 6. Variables rendered via Mustache
// 7. Email sent via SMTP (Nodemailer)
// 8. Status updated in EmailLog (SENT, FAILED)
// 9. Retry on failure (up to 3 attempts)
// 10. MailHog captures emails in development

// Template Caching:
// - Templates cached in memory after first load
// - Cache invalidation on template updates
// - Configurable TTL for cache entries
```

### RBAC Implementation Pattern
```typescript
// Permission-based access control:
// 1. Define permissions in database (resource:action:scope)
//    Examples: "users:create:own", "roles:update:all", "data-objects:delete:all"
// 2. Assign permissions to roles via RolePermission
// 3. Assign roles to users via UserRole
// 4. Use @RequirePermissions decorator on endpoints:
@RequirePermissions('users:update:all')
async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  // Only users with this permission can access
}

// 5. Frontend route guards check user roles:
{
  path: '/admin/users',
  component: UserManagementView,
  meta: { requiresAuth: true, requiresRole: 'SUPER_ADMIN' }
}

// 6. Time-limited role assignments:
// - Create RoleAssignment with expiresAt date
// - System automatically revokes expired assignments
// - Track who assigned/revoked in audit trail

// Default roles: SUPER_ADMIN, ADMIN, USER, INVESTOR
```

### Multi-tenant Data Access Pattern
```typescript
// Multi-tenancy support (planned for future):
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

// Note: Current implementation is single-tenant
// Multi-tenant isolation via RLS planned for future
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
- **Database Indexing**: Strategic indexes on frequently queried fields (user emails, session tokens, etc.)
- **Lazy Loading**: Vue Router lazy-loads all route components
- **Pagination**: Cursor-based pagination for large datasets (documented pattern)
- **Request/Response Caching**: Redis caching for session data and template caching for emails
- **Database Query Optimization**: Prisma select statements to fetch only needed fields
- **CDN for Static Assets**: Planned for production
- **WebSocket for Real-time**: Planned for future (notifications, live updates)
- **Job Queues**: Database-backed email queue implemented; Bull queues for other jobs planned

### Security Implementation Details
```typescript
// Multi-layer security approach:

// 1. Helmet.js: HTTP security headers (CSP, HSTS, etc.)
app.use(helmet());

// 2. CORS: Configured origin whitelist
app.enableCors({ origin: allowedOrigins, credentials: true });

// 3. CSRF Protection: Double-submit cookie pattern
// - CSRF token generated on login
// - Token validated on state-changing operations
// - Custom CSRF middleware in common/middleware/

// 4. Input Validation: class-validator on all DTOs
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(8)
  @Matches(/complex-regex/)
  password: string;
}

// 5. XSS Prevention: isomorphic-dompurify sanitization
// - Input sanitization service in common/services/
// - Sanitizes user inputs before storage

// 6. SQL Injection Prevention: Prisma parameterized queries
// - No raw SQL queries without proper escaping

// 7. Rate Limiting: IP-based throttling
@UseGuards(IpThrottlerGuard)
@Throttle(10, 60) // 10 requests per 60 seconds
async endpoint() { }

// 8. Audit Logging: All critical operations logged
await auditLogger.log({
  action: 'USER_LOGIN',
  userId,
  ipAddress,
  metadata: { ... }
});

// 9. Secure Password Hashing: bcrypt with 12 rounds
const hash = await bcrypt.hash(password, 12);

// 10. JWT Security:
// - Short-lived access tokens (15 min)
// - Long-lived refresh tokens (7 days)
// - Refresh token rotation on use
// - Tokens stored securely (Redis + database)
```

## Implemented Features Status

### ✅ Fully Implemented Features

**Authentication & User Management**
- JWT + Passport.js authentication with refresh token rotation
- Temporary password system with expiration
- User registration and activation
- Password strength validation and secure hashing (bcrypt, 12 rounds)
- User profile management (avatar, preferences, timezone, language)
- Session management with Redis
- CSRF protection with double-submit cookie pattern
- Multi-factor authentication ready (structure in place)

**Role-Based Access Control (RBAC)**
- Complete RBAC system with roles, permissions, and assignments
- Permission-based API access control with @RequirePermissions decorator
- Role-based route guards in frontend
- Time-limited role assignments with expiration and revocation
- Default roles: SUPER_ADMIN, ADMIN, USER, INVESTOR
- Granular permissions (resource:action:scope pattern)
- User-role many-to-many relationships

**Admin Panel**
- User management (CRUD, role assignment, activation)
- Role management (CRUD, permission assignment)
- Permission management (CRUD, resource-based)
- RBAC setup (one-time initialization)
- Audit trail viewer with filtering and search
- Email template management with preview
- Plugin management (upload, install, uninstall)
- Data object management (visual editor)
- System analytics dashboard
- Email statistics dashboard

**Email System**
- Email template management with Mustache templating
- Variable schema validation for templates
- Email queue with database-backed retry logic (max 3 attempts)
- 5-service architecture (email, queue, templates, rendering, caching)
- Template versioning support
- Email tracking (sent, failed, pending statuses)
- Email categories (ACCOUNT, DOCUMENT, CAPITAL_CALL, DISTRIBUTION, SYSTEM)
- SMTP provider integration via Nodemailer
- MailHog integration for development testing
- Template caching for performance

**Plugin System**
- Plugin upload and extraction (ZIP files)
- Plugin manifest validation (plugin.json with semver)
- Plugin installation and lifecycle management
- Plugin status tracking (UPLOADED, INSTALLED, FAILED, UNINSTALLED)
- Frontend plugin registry with dynamic loading
- Plugin context injection for host app access
- Audit trail for plugin operations
- Sample hello-world plugin included

**Dynamic Data Objects System**
- Admin visual editor for creating custom data structures
- 13 field types supported (TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, BOOLEAN, SINGLE_SELECT, MULTI_SELECT, EMAIL, URL, FILE, RICH_TEXT, RELATIONSHIP)
- EAV (Entity-Attribute-Value) storage pattern
- Field validation rules (min/max length, regex, custom)
- Dropdown options for select fields
- Relationship support between data objects
- Schema versioning for backward compatibility
- Full audit trail with before/after change tracking
- Dynamic CRUD UI for end users (list, detail, form views)
- Dynamic cell renderers and form field components
- File upload support in data objects

**Security**
- Helmet.js for HTTP security headers
- CORS with origin whitelisting
- Content Security Policy (CSP)
- CSRF protection middleware
- Input validation with class-validator
- XSS prevention with isomorphic-dompurify
- SQL injection prevention via Prisma ORM
- Rate limiting with IP-based throttling
- Request size limits
- Comprehensive audit logging
- Secure session management

**Testing Infrastructure**
- Backend: 64 Jest test files with 80% minimum coverage
- Frontend: 88 Vitest + Playwright test files with 80% minimum coverage
- Test factories for data generation
- Comprehensive mocking (Prisma, JWT, Config, Session, Audit Logger)
- E2E tests with Playwright
- Security and performance test suites
- CI/CD with GitHub Actions
- Codecov integration with automated coverage badges
- Auto-merge on passing tests

**Developer Experience**
- Docker Compose with 13 services
- MailHog for email testing
- pgAdmin for database management
- Redis Commander for cache inspection
- Swagger/OpenAPI documentation at /api-docs
- Hot reload for frontend and backend
- ESLint + Prettier with pre-commit hooks
- pnpm workspace monorepo setup

### 🚧 Partially Implemented / Planned Features

**Document Management**
- ✅ File upload support in dynamic data objects
- ✅ PDF.js integration for viewing
- ⏳ Virus scanning (ClamAV) - planned
- ⏳ Presigned URLs for S3 - planned
- ⏳ Document versioning - planned
- ⏳ S3-compatible storage - planned (currently local storage)

**Multi-tenancy**
- ✅ Data model structure supports future multi-tenancy
- ⏳ Row-Level Security (RLS) in PostgreSQL - planned
- ⏳ Tenant isolation - planned
- ⏳ Tenant-specific configuration - planned

**Real-time Features**
- ⏳ WebSocket integration - planned
- ⏳ Live notifications - planned
- ⏳ Real-time collaboration - planned

**Analytics & Reporting**
- ✅ Chart.js integration ready
- ✅ Analytics view component
- ⏳ Performance reporting - planned
- ⏳ Custom dashboards - planned
- ⏳ Export to Excel/CSV/PDF - planned

**Capital Activity Features (PE-specific)**
- ⏳ Capital calls tracking - planned
- ⏳ Distributions management - planned
- ⏳ Commitment tracking - planned
- ⏳ Transaction history - planned
- ⏳ NAV calculations - planned
- ⏳ IRR/MOIC calculations - planned

Note: The dynamic data objects system can be used to model these PE-specific features, but dedicated modules are planned for better UX and specialized business logic.

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
- **Database Queries**: Always use Prisma with proper typing and optimization (✅ implemented)
- **Authentication**: Custom JWT + Passport.js with refresh token rotation (✅ implemented)
- **State Management**: Use Pinia stores (auth.ts, pluginRegistry.ts) with TypeScript (✅ implemented)
- **Styling**: Apply Tailwind utilities following atomic design principles (✅ implemented)
- **API Endpoints**: Follow NestJS module/controller/service pattern (✅ implemented)
- **Form Handling**: Vue 3 forms with validation (VeeValidate patterns recommended)
- **Real-time Updates**: WebSocket implementation planned (⏳ future)
- **File Uploads**: Implemented in dynamic data objects; multer used for plugin uploads (✅ implemented)
- **Background Jobs**: Database-backed email queue (✅ implemented); Bull queues for other jobs (⏳ planned)
- **Caching**: Redis caching for sessions, template caching for emails (✅ implemented)

## Additional Resources
- [Vue 3 Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OWASP Security Guidelines](https://owasp.org/)

## API Endpoints Reference

The backend exposes the following API endpoint groups (access `/api-docs` for full Swagger documentation):

- **POST /api/auth/login** - User login (returns JWT + refresh token)
- **POST /api/auth/refresh** - Refresh access token
- **POST /api/auth/logout** - Logout and invalidate session
- **POST /api/auth/set-password** - Set password (for temporary passwords)
- **GET /api/admin/users** - List users (SUPER_ADMIN/ADMIN)
- **POST /api/admin/users** - Create user (SUPER_ADMIN/ADMIN)
- **PATCH /api/admin/users/:id** - Update user (SUPER_ADMIN/ADMIN)
- **DELETE /api/admin/users/:id** - Delete user (SUPER_ADMIN)
- **GET /api/admin/roles** - List roles (SUPER_ADMIN/ADMIN)
- **POST /api/admin/roles** - Create role (SUPER_ADMIN)
- **GET /api/admin/permissions** - List permissions (SUPER_ADMIN/ADMIN)
- **POST /api/admin/permissions** - Create permission (SUPER_ADMIN)
- **POST /api/admin/rbac-setup** - Initialize RBAC (one-time, SUPER_ADMIN)
- **GET /api/admin/audit-trail** - View audit logs (SUPER_ADMIN/ADMIN)
- **GET /api/email/templates** - List email templates (ADMIN)
- **POST /api/email/templates** - Create email template (ADMIN)
- **GET /api/email/stats** - Email statistics (ADMIN)
- **POST /api/plugin/upload** - Upload plugin ZIP (ADMIN)
- **POST /api/plugin/:id/install** - Install plugin (ADMIN)
- **DELETE /api/plugin/:id** - Uninstall plugin (ADMIN)
- **GET /api/data-objects** - List data object definitions (ADMIN)
- **POST /api/data-objects** - Create data object (ADMIN)
- **GET /api/dynamic/:objectName** - List instances (permission-based)
- **POST /api/dynamic/:objectName** - Create instance (permission-based)
- **GET /api/dynamic/:objectName/:id** - Get instance (permission-based)
- **PATCH /api/dynamic/:objectName/:id** - Update instance (permission-based)
- **DELETE /api/dynamic/:objectName/:id** - Delete instance (permission-based)
- **GET /health** - Health check (no auth required)

## Development Notes

### Important Configuration
- **Frontend Dev Server**: http://localhost:3000 (Vite)
- **Backend API**: http://localhost:5173 (NestJS in Docker) or http://localhost:3001 (local)
- **API Documentation**: http://localhost:5173/api-docs (Swagger UI)
- **PostgreSQL**: localhost:5432 (docker) - Database: investor_portal
- **Redis**: localhost:6379 (docker) - Session storage and caching
- **MailHog**: http://localhost:8025 (email testing UI)
- **pgAdmin**: http://localhost:8080 (database management UI)
- **Redis Commander**: http://localhost:8081 (Redis inspection UI)

### Active Services
- **Don't start frontend or backend services** - They are currently running
- Frontend runs on port 3000
- Backend API runs on port 5173 (docker) or 3001 (local)

### Key Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/investor_portal"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@investorportal.com"

# Frontend (.env)
VITE_API_URL="http://localhost:5173"
VITE_APP_TITLE="PE Investor Portal"
```

### Database Migrations
11 migrations have been applied:
1. Initial test migration
2. Role and permissions setup
3. Investor portal core models
4. Email system models
5. Temporary password support
6. Plugin system
7. Dynamic data objects
8. UUID validation
9. Relationship field support
10. Investment/portfolio feature removal
11. Latest schema updates

Run `pnpm run db:migrate` to apply pending migrations.

## Summary

This guide should be referenced for all development decisions and code assistance to maintain consistency and quality across the project. Update this document as patterns evolve and new decisions are made.

**Last Updated**: Based on comprehensive codebase review as of current state
**Project Status**: Core infrastructure complete; PE-specific features to be built on dynamic data system
**Test Coverage**: 80% minimum enforced via CI/CD
**Active Branch**: Main branch with feature development via pull requests