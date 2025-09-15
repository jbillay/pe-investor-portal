# Backend Testing Guide

This directory contains comprehensive tests for the PE Investor Portal backend authentication system. The tests are organized by type and scope to ensure thorough coverage of all authentication functionality.

## Test Structure

### Unit Tests (`src/**/*.spec.ts`)
Located alongside source code files, these tests focus on individual components in isolation:

- **AuthService** (`src/auth/services/auth.service.spec.ts`)
  - User registration with validation
  - Login authentication with password verification
  - JWT token generation and refresh
  - Session management and cleanup
  - Multi-tenant isolation

- **SessionService** (`src/auth/services/session.service.spec.ts`)
  - Session creation and storage (Redis + Database)
  - Session retrieval with caching fallback
  - Session revocation and cleanup
  - User session management across devices

- **JwtStrategy** (`src/auth/strategies/jwt.strategy.spec.ts`)
  - JWT token validation and decoding
  - User authentication state verification
  - Tenant validation and access control
  - Error handling for invalid tokens

- **AuthController** (`src/auth/auth.controller.spec.ts`)
  - HTTP request/response handling
  - Input validation and sanitization
  - IP address extraction and logging
  - Route-specific authentication logic

### Integration Tests (`test/*.e2e-spec.ts`)
End-to-end tests that verify complete user workflows:

- **Authentication Flows** (`test/auth.e2e-spec.ts`)
  - Complete registration-to-login workflows
  - Multi-step authentication processes
  - Cross-component integration testing
  - Real database and Redis interactions

### Security Tests (`test/*.security.e2e-spec.ts`)
Specialized tests focused on security vulnerabilities:

- **Password Security** (`test/auth.security.e2e-spec.ts`)
  - Password complexity enforcement
  - Secure hashing verification (bcrypt)
  - Timing attack resistance
  
- **JWT Token Security**
  - Token tampering detection
  - Signature validation
  - Expiration enforcement
  - Malformed token handling

- **Rate Limiting**
  - Brute force attack prevention
  - Request throttling validation
  - Concurrent request handling

- **Input Validation**
  - SQL injection prevention
  - XSS attack mitigation
  - Input sanitization verification
  - Data type validation

- **Session Security**
  - Session fixation prevention
  - Concurrent session management
  - Session metadata tracking
  - Cross-tenant data isolation

- **Information Disclosure**
  - Error message sanitization
  - Sensitive data exposure prevention
  - System information leakage prevention

### Performance Tests (`test/*.performance.e2e-spec.ts`)
Tests that verify system performance under various conditions:

- **Authentication Performance**
  - Registration response times
  - Login authentication speed
  - Concurrent user handling
  - Token validation performance

- **Database Query Optimization**
  - User lookup efficiency
  - Session cleanup performance
  - Index utilization verification

- **Redis Caching Performance**
  - Cache read/write speeds
  - High-volume operation handling
  - Memory usage optimization

- **Resource Management**
  - Memory leak detection
  - Connection pool management
  - Garbage collection efficiency

## Test Configuration

### Jest Configuration (`jest.config.js`)
The project uses Jest with multiple test environments:

- **Unit Tests**: Fast, isolated component testing
- **Integration Tests**: Full system integration (30s timeout)
- **Security Tests**: Comprehensive security validation (60s timeout)  
- **Performance Tests**: Performance benchmarking (120s timeout)

### Test Setup (`test/setup.ts`)
Global test configuration including:
- Database connection setup
- Redis connection configuration
- Global test utilities
- Environment variable management

### Test Utilities (`test/utils/test-utils.ts`)
Shared testing utilities:
- **TestDataGenerator**: Creates realistic test data
- **DatabaseTestHelper**: Database mocking and setup
- **RequestHelper**: HTTP request mocking
- **Mock Services**: Prisma and Redis service mocks

## Running Tests

### All Tests
```bash
npm test
```

### Test by Type
```bash
# Unit tests only
npm test -- --selectProjects=unit

# Integration tests only
npm test -- --selectProjects=integration

# Security tests only
npm test -- --selectProjects=security

# Performance tests only
npm test -- --selectProjects=performance
```

### Test with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Coverage Requirements

The project maintains high test coverage standards:

- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Statements**: 80% minimum

### Coverage Reports
- **Text**: Console output during test runs
- **LCOV**: Machine-readable format for CI/CD
- **HTML**: Detailed interactive reports in `coverage/` directory

## Test Data Management

### Database Testing
- Each test uses isolated database transactions
- Test data is automatically cleaned up between tests
- Database state is reset before each test suite
- Prisma mock services prevent real database dependencies in unit tests

### Redis Testing  
- Redis cache is flushed between test suites
- Mock Redis service for unit test isolation
- Real Redis integration for end-to-end testing

### Environment Variables
Tests use dedicated test configuration:
- Separate test database
- Isolated Redis instance
- Test-specific JWT secrets
- Reduced bcrypt rounds for faster testing

## Best Practices

### Writing Tests
1. **Arrange, Act, Assert**: Clear test structure
2. **Descriptive Names**: Tests should describe behavior
3. **Single Responsibility**: One assertion per test when possible
4. **Test Edge Cases**: Invalid inputs, error conditions
5. **Mock External Dependencies**: Database, Redis, external APIs

### Test Organization
1. **Logical Grouping**: Related tests in describe blocks
2. **Setup/Teardown**: Proper test isolation
3. **Data Generation**: Use TestDataGenerator for consistency
4. **Error Testing**: Verify error handling paths

### Performance Considerations
1. **Fast Unit Tests**: Mock heavy dependencies
2. **Reasonable Timeouts**: Appropriate for test complexity
3. **Parallel Execution**: Tests should be parallelizable
4. **Resource Cleanup**: Prevent memory leaks in tests

## Common Testing Patterns

### Authentication Testing
```typescript
// Test successful authentication
it('should authenticate user with valid credentials', async () => {
  const user = await createTestUser();
  const result = await authService.login(user.email, 'password');
  expect(result).toHaveProperty('accessToken');
});

// Test authentication failure
it('should reject invalid credentials', async () => {
  await expect(
    authService.login('invalid@email.com', 'wrong-password')
  ).rejects.toThrow('Invalid credentials');
});
```

### Database Testing
```typescript
// Test with transaction rollback
it('should create user in database', async () => {
  const userData = TestDataGenerator.generateUser();
  const user = await userService.create(userData);
  
  expect(user.id).toBeDefined();
  expect(user.email).toBe(userData.email);
});
```

### Mock Usage
```typescript
// Service mocking
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

// Database mocking
DatabaseTestHelper.mockUserExists(testUser);
DatabaseTestHelper.mockUserNotExists();
```

## Debugging Tests

### Debug Individual Tests
```bash
# Run specific test file
npm test -- auth.service.spec.ts

# Run specific test case
npm test -- --testNamePattern="should authenticate user"

# Verbose output
npm test -- --verbose
```

### Debug Failed Tests
```bash
# Run only failed tests
npm test -- --onlyFailures

# Update snapshots
npm test -- --updateSnapshot
```

### Common Issues
1. **Timeout Errors**: Increase timeout for slow tests
2. **Database Conflicts**: Ensure proper test isolation
3. **Mock Issues**: Verify mock setup and reset
4. **Environment Variables**: Check test configuration

## Contributing

When adding new features:
1. Write unit tests for new services/components
2. Add integration tests for new endpoints
3. Include security tests for authentication changes
4. Add performance tests for critical paths
5. Update coverage thresholds if needed
6. Document new testing patterns in this guide

## Continuous Integration

Tests are automatically run in CI/CD pipeline:
- All test types must pass
- Coverage thresholds must be met
- Performance benchmarks must not regress
- Security tests must pass without exceptions

For local development, run the full test suite before committing:
```bash
npm run test:ci
```