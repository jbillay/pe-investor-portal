# PE Investor Portal - Backend API

A robust, enterprise-grade backend service built with NestJS for the Private Equity Investor Portal. This API provides comprehensive authentication, multi-tenant support, and secure document management capabilities.

## 🚀 Features

- **🔐 Advanced Authentication**: JWT-based authentication with refresh token rotation
- **🏢 Multi-Tenant Architecture**: Complete tenant isolation with Row-Level Security
- **⚡ High Performance**: Redis caching and session management
- **📊 Comprehensive Logging**: Structured logging and audit trails
- **🛡️ Enterprise Security**: Rate limiting, input validation, and security headers
- **📚 Auto-Generated Documentation**: Swagger/OpenAPI integration
- **🐳 Docker Ready**: Production-ready containerization
- **🗄️ Type-Safe Database**: Prisma ORM with PostgreSQL

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Multi-Tenant Support](#multi-tenant-support)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm 8+

### Installation

1. **Install dependencies**:
   ```bash
   cd app/backend
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp ../../.env.example ../../.env
   # Edit .env with your configuration
   ```

3. **Generate Prisma client**:
   ```bash
   pnpm run prisma:generate
   ```

4. **Run database migrations**:
   ```bash
   pnpm run prisma:migrate
   ```

5. **Start the development server**:
   ```bash
   pnpm run start:dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Interactive API documentation is available via Swagger UI:

- **Development**: http://localhost:3000/api-docs
- **Production**: https://your-domain.com/api-docs

### Key Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/health` | GET | Health check | None |
| `/api/auth/register` | POST | User registration | None |
| `/api/auth/login` | POST | User authentication | None |
| `/api/auth/refresh` | POST | Token refresh | None |
| `/api/auth/logout` | POST | User logout | JWT |
| `/api/auth/logout-all` | POST | Logout from all devices | JWT |
| `/api/auth/profile` | GET | User profile | JWT |
| `/api/auth/validate` | GET | Token validation | JWT |

## 🔐 Authentication

The API implements a secure JWT-based authentication system with the following features:

### Token Strategy

- **Access Tokens**: 15-minute expiry, used for API requests
- **Refresh Tokens**: 7-day expiry, used to obtain new access tokens
- **Token Rotation**: Refresh tokens are rotated on each use for enhanced security

### Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server returns access + refresh tokens
3. **API Requests**: Access token sent in `Authorization: Bearer <token>` header
4. **Token Refresh**: Use refresh token to get new access token
5. **Logout**: Tokens are revoked and blacklisted

### Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: Configurable limits per endpoint
- **Session Management**: Redis-based session storage
- **Audit Logging**: Complete authentication audit trail

## 🏢 Multi-Tenant Support

### Tenant Resolution

The API supports multiple tenant resolution methods:

1. **Header**: `X-Tenant-ID` header
2. **Query Parameter**: `?tenantId=<tenant-id>`
3. **Subdomain**: `tenant.yourdomain.com` (production)
4. **JWT Claims**: Automatic resolution from user token

### Data Isolation

- **Row-Level Security**: PostgreSQL RLS policies ensure tenant data isolation
- **Automatic Filtering**: All database queries are automatically scoped to tenant
- **Cascade Operations**: Tenant deletion cascades to all related data

## 🗄️ Database Schema

### Core Entities

#### User Management
- **Tenant**: Multi-tenant organization
- **User**: User accounts with tenant association
- **UserProfile**: Extended user information
- **Session**: Refresh token management

#### Security & Audit
- **AuditLog**: Complete audit trail of user actions

## ⚙️ Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=development
APP_PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
```

### Optional Variables

```bash
# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10

# CORS
FRONTEND_URL=http://localhost:5173

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm run start:dev          # Start with hot reload
pnpm run start:debug        # Start in debug mode

# Building
pnpm run build             # Production build
pnpm run start:prod        # Start production build

# Database
pnpm run prisma:generate   # Generate Prisma client
pnpm run prisma:migrate    # Run migrations
pnpm run prisma:studio     # Open Prisma Studio
pnpm run prisma:reset      # Reset database

# Testing
pnpm run test              # Unit tests
pnpm run test:watch        # Watch mode
pnpm run test:cov          # Coverage report
pnpm run test:e2e          # End-to-end tests

# Code Quality
pnpm run lint              # ESLint
pnpm run format            # Prettier
```

### Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── decorators/        # Custom decorators
│   ├── dto/              # Data transfer objects
│   ├── guards/           # Authentication guards
│   ├── interfaces/       # TypeScript interfaces
│   ├── services/         # Business logic
│   └── strategies/       # Passport strategies
├── common/               # Shared utilities
│   ├── middleware/       # Custom middleware
│   ├── prisma/          # Database service
│   └── redis/           # Redis service
└── health/              # Health check endpoints
```

## 🐳 Deployment

### Docker Deployment

The application includes production-ready Docker configuration:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale services
docker-compose up --scale backend=3
```

## 🛡️ Security

### Implemented Security Measures

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**: Per-endpoint and global rate limits
- **Input Validation**: Comprehensive request validation
- **JWT Security**: Short-lived tokens with secure refresh mechanism

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## 📊 Monitoring

### Audit Trail

Complete audit logging for:
- User registration and login
- Token refresh and logout
- Profile modifications
- Administrative actions

## 📝 API Examples

### Authentication Examples

#### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123"
  }'
```

#### Authenticated Request

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using NestJS, TypeScript, and modern development practices.**
