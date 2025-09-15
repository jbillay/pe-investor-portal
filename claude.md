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

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS (enterprise-grade with dependency injection)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT + refresh token rotation

### Security & Multi-tenancy
- **Data Isolation**: Row-Level Security (RLS) in PostgreSQL
- **Authentication**: JWT tokens with secure refresh rotation
- **Document Security**: Presigned URLs for secure access
- **Configuration**: Environment variables + database-stored preferences

### Development & Deployment
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm
- **Code Quality**: Prettier + Husky + lint-staged
- **Testing**: Jest framework
- **Document Viewing**: PDF.js for in-browser rendering

## Development Guidelines

### Code Standards
- Use TypeScript strict mode throughout the stack
- Follow functional programming patterns where possible
- Implement proper error handling with typed exceptions
- Use async/await over Promises for better readability
- Apply SOLID principles, especially in NestJS services

### Database Patterns
- Always use Prisma schema for database changes
- Implement proper migrations for schema updates
- Index frequently queried fields
- Use transactions for complex operations

### API Design
- Follow RESTful principles with proper HTTP status codes
- Implement proper request validation using class-validator
- Use DTOs for request/response typing
- Apply rate limiting and request size limits
- Document APIs with Swagger/OpenAPI

### Security Best Practices
- Validate all inputs on both client and server
- Implement proper CORS configuration
- Use HTTPS in all environments except local development
- Store sensitive data using proper encryption
- Implement proper session management with Redis

### Frontend Patterns
- Use Vue 3 Composition API consistently
- Implement proper component composition for each UI elements
- Use Pinia stores for shared state
- Apply Tailwind utility classes following atomic design
- Implement proper form validation with VeeValidate

### Testing Strategy
- Write unit tests for business logic
- Implement integration tests for API endpoints
- Use Jest with proper mocking for external services
- Test authentication flows thoroughly
- Implement e2e tests for critical user journeys

## File Structure Conventions

```
project-root/
├── apps/
│   ├── frontend/           # Vue.js application
│   │   ├── src/
│   │   │   ├── components/ # Reusable Vue components
│   │   │   ├── views/      # Page components
│   │   │   ├── docs/       # Documentation
│   │   │   ├── stores/     # Pinia stores
│   │   │   ├── composables/# Vue composables
│   │   │   └── types/      # TypeScript type definitions
│   │   └── ...
│   └── backend/            # NestJS application
│       ├── src/
│       │   ├── modules/    # Feature modules
│       │   ├── common/     # Shared utilities
│       │   ├── guards/     # Authentication guards
│       │   ├── types/      # TypeScript definitions
│   │   │   └── prisma/     # Prisma schema and migrations
│       └── ...
├── packages/
│   ├── shared/             # Shared types and utilities
├── docker/                 # Docker configuration
└── docs/                   # Project documentation
```

## Common Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d  # Database and Redis
npm dev             # Start both frontend and backend

# Database operations
npm db:migrate     # Run Prisma migrations
npm db:seed        # Seed development data
npm db:studio      # Open Prisma Studio
```

### Code Quality
```bash
# Linting and formatting
npm format         # Run Prettier
npm type-check     # TypeScript validation

# Testing
npm test           # Run all tests
npm test:watch     # Run tests in watch mode
npm test:coverage  # Generate coverage report
```

## Key Implementation Patterns

### Authentication Flow
- Use NextAuth.js providers for OAuth integration
- Implement custom JWT strategy with refresh tokens
- Apply route guards in both frontend and backend

### Document Management
- Generate presigned URLs for secure upload/download
- Implement virus scanning for uploaded files
- Use PDF.js for secure in-browser viewing
- Store document metadata in PostgreSQL

### Error Handling
- Use custom exception filters in NestJS
- Implement proper error boundaries in Vue
- Log errors with structured logging
- Return user-friendly error messages

### Performance Optimization
- Implement proper database indexing
- Use lazy loading for Vue components
- Apply pagination for large data sets

## When Helping with Code

### Always Consider
1. **Type Safety**: Ensure all code is properly typed
2. **Security**: Validate inputs and implement proper authorization
3. **Error Handling**: Implement comprehensive error handling
4. **Testing**: Suggest testable code patterns
5. **Performance**: Consider optimization opportunities

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Authentication/authorization is implemented
- [ ] Error handling is comprehensive
- [ ] Database queries are optimized
- [ ] Security best practices are followed
- [ ] Code follows established patterns
- [ ] Tests are included for new functionality

### Common Solutions
- **Database Queries**: Always use Prisma with proper typing
- **Authentication**: Leverage NextAuth.js patterns
- **State Management**: Use Pinia with proper TypeScript integration
- **Styling**: Apply Tailwind utilities following atomic design
- **API Endpoints**: Follow NestJS controller/service pattern
- **Form Handling**: Use VeeValidate with PrimeVue components

This guide should be referenced for all development decisions and code assistance to maintain consistency and quality across the project.