# Comprehensive Testing Strategy

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Backend Testing Strategy](#backend-testing-strategy)
3. [Frontend Testing Strategy](#frontend-testing-strategy)
4. [Test Organization](#test-organization)
5. [CI/CD Integration](#cicd-integration)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Best Practices](#best-practices)

---

## Testing Philosophy

### Core Principles

1. **No Database Dependencies**: All tests must use mocks only - no real database connections
2. **High Coverage Target**: Minimum 80% coverage per file, 90% for critical services
3. **Incremental Development**: Tests added one at a time, all must pass before continuing
4. **Test-Driven Development (TDD)**: Write tests BEFORE implementation when possible
5. **Simplicity First**: Keep tests simple, focused, and easy to understand
6. **Fast Execution**: Tests should run quickly (unit tests < 1s, integration < 5s)
7. **Continuous Testing**: No skipped tests allowed in codebase

### Testing Pyramid

```
       /\
      /  \     10% E2E Tests
     /____\    (Playwright - Critical user flows)
    /      \
   /        \  20% Integration Tests
  /__________\ (API endpoints, component integration)
 /            \
/______________\ 70% Unit Tests
                 (Services, utilities, composables)
```

### Coverage Requirements

- **Per File**: 80% minimum (statements, branches, functions, lines)
- **Critical Services**: 90% minimum
  - Authentication services
  - Authorization/RBAC logic
  - Payment processing
  - Data validation
- **Overall Project**: 85% minimum
- **Coverage Gates**: CI/CD blocks PRs below thresholds

---

## Backend Testing Strategy

### Technology Stack

- **Test Framework**: Jest v29+
- **Mocking**: Jest mocks + custom mock factories
- **Database**: Mock Prisma Client (NO real database)
- **Coverage**: Jest coverage with Istanbul
- **Test Types**: Unit, Integration (controller + service)

### File Structure

```
app/backend/src/
├── [module]/
│   ├── services/
│   │   ├── user.service.ts
│   │   └── user.service.spec.ts       # Unit tests for service
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   └── user.controller.spec.ts    # Integration tests
│   ├── dto/
│   │   └── *.dto.ts                   # No tests needed (type definitions)
│   └── entities/
│       └── *.entity.ts                # No tests needed (Prisma models)
```

### Service Testing Pattern

**File**: `*.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;

  // Mock Prisma Client
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add other models as needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com', firstName: 'John' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserById('999')).rejects.toThrow(NotFoundException);
    });
  });

  // Additional test cases for each method...
});
```

### Controller Testing Pattern

**File**: `*.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  // Mock service
  const mockUserService = {
    getUserById: jest.fn(),
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com' };
      service.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getUserById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith('1');
    });
  });

  // Additional test cases...
});
```

### Guard Testing Pattern

**File**: `*.guard.spec.ts`

```typescript
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles required', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockExecutionContext(['USER']);

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockExecutionContext(['ADMIN']);

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockExecutionContext(['USER']);

    // Act
    const result = guard.canActivate(context);

    // Assert
    expect(result).toBe(false);
  });
});

function createMockExecutionContext(userRoles: string[]): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { roles: userRoles },
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
}
```

### Middleware Testing Pattern

**File**: `*.middleware.spec.ts`

```typescript
import { CsrfMiddleware } from './csrf.middleware';
import { Request, Response, NextFunction } from 'express';

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new CsrfMiddleware();
    nextFunction = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should pass when CSRF token matches', () => {
    // Arrange
    mockRequest = {
      cookies: { 'XSRF-TOKEN': 'valid-token' },
      headers: { 'x-xsrf-token': 'valid-token' },
    };

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject when CSRF token missing', () => {
    // Arrange
    mockRequest = {
      cookies: {},
      headers: {},
    };

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
```

### Common Mocking Patterns

#### Prisma Service Mock

```typescript
export const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    aggregate: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Add other models as needed
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
});
```

#### Config Service Mock

```typescript
export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRATION: '1h',
      DATABASE_URL: 'postgresql://test',
    };
    return config[key];
  }),
});
```

#### Email Service Mock

```typescript
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
});
```

---

## Frontend Testing Strategy

### Technology Stack

- **Unit Tests**: Vitest v1+ (faster than Jest for Vue)
- **Component Tests**: Vue Test Utils + Vitest
- **E2E Tests**: Playwright
- **Coverage**: Vitest coverage with Istanbul/C8
- **Mocking**: vi.mock() for modules, createMockRouter for routing

### File Structure

```
app/frontend/src/
├── components/
│   ├── UserCard.vue
│   └── __tests__/
│       └── UserCard.spec.ts           # Component unit tests
├── composables/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.spec.ts            # Composable unit tests
├── services/
│   ├── userApiService.ts
│   └── __tests__/
│       └── userApiService.spec.ts     # Service unit tests
├── stores/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.spec.ts               # Store unit tests
├── views/
│   ├── DashboardView.vue
│   └── __tests__/
│       └── DashboardView.spec.ts      # View integration tests
└── e2e/
    ├── csrf-protection.spec.ts        # E2E critical flows
    └── user-management.spec.ts
```

### Composable Testing Pattern

**File**: `composables/__tests__/useAuth.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from '../useAuth';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

// Mock dependencies
vi.mock('@/stores/auth');
vi.mock('vue-router');

describe('useAuth', () => {
  let mockAuthStore: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthStore = {
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
    };
    (useAuthStore as any).mockReturnValue(mockAuthStore);

    mockRouter = {
      push: vi.fn(),
    };
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('should return auth state', () => {
    // Act
    const { isAuthenticated, user } = useAuth();

    // Assert
    expect(isAuthenticated.value).toBe(false);
    expect(user.value).toBeNull();
  });

  it('should login successfully', async () => {
    // Arrange
    mockAuthStore.login.mockResolvedValue({ success: true });
    const { login } = useAuth();

    // Act
    await login('test@example.com', 'password');

    // Assert
    expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should logout and redirect', async () => {
    // Arrange
    mockAuthStore.logout.mockResolvedValue(undefined);
    const { logout } = useAuth();

    // Act
    await logout();

    // Assert
    expect(mockAuthStore.logout).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

### Component Testing Pattern

**File**: `components/__tests__/UserCard.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UserCard from '../UserCard.vue';
import { createTestingPinia } from '@pinia/testing';

describe('UserCard', () => {
  it('should render user information', () => {
    // Arrange
    const user = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    // Act
    const wrapper = mount(UserCard, {
      props: { user },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    // Assert
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john@example.com');
  });

  it('should emit edit event when edit button clicked', async () => {
    // Arrange
    const user = { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const wrapper = mount(UserCard, {
      props: { user },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    // Act
    await wrapper.find('[data-testid="edit-button"]').trigger('click');

    // Assert
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([user]);
  });

  it('should show loading state when loading prop is true', () => {
    // Arrange & Act
    const wrapper = mount(UserCard, {
      props: {
        user: null,
        loading: true,
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    // Assert
    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true);
  });
});
```

### Store Testing Pattern

**File**: `stores/__tests__/auth.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import * as authApi from '@/services/authApiService';

// Mock API service
vi.mock('@/services/authApiService');

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with null user', () => {
    // Act
    const store = useAuthStore();

    // Assert
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should login successfully and set user', async () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'John' };
    vi.mocked(authApi.login).mockResolvedValue({ user: mockUser, token: 'token123' });
    const store = useAuthStore();

    // Act
    await store.login('test@example.com', 'password');

    // Assert
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle login failure', async () => {
    // Arrange
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
    const store = useAuthStore();

    // Act & Assert
    await expect(store.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should logout and clear user', async () => {
    // Arrange
    const store = useAuthStore();
    store.user = { id: '1', email: 'test@example.com' } as any;
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    // Act
    await store.logout();

    // Assert
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(authApi.logout).toHaveBeenCalled();
  });
});
```

### Service Testing Pattern

**File**: `services/__tests__/userApiService.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserById, getAllUsers, createUser } from '../userApiService';
import { useApi } from '@/composables/useApi';

// Mock useApi composable
vi.mock('@/composables/useApi');

describe('User API Service', () => {
  let mockGet: any;
  let mockPost: any;

  beforeEach(() => {
    mockGet = vi.fn();
    mockPost = vi.fn();
    vi.mocked(useApi).mockReturnValue({
      get: mockGet,
      post: mockPost,
    } as any);
  });

  describe('getUserById', () => {
    it('should fetch user by id', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com' };
      mockGet.mockResolvedValue({ data: mockUser });

      // Act
      const result = await getUserById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalledWith('/users/1');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockGet.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(getUserById('999')).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      // Arrange
      const userData = { email: 'new@example.com', firstName: 'Jane' };
      const mockResponse = { id: '2', ...userData };
      mockPost.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await createUser(userData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/users', userData);
    });
  });
});
```

### E2E Testing Pattern (Playwright)

**File**: `e2e/user-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should display users list', async ({ page }) => {
    // Navigate to users page
    await page.goto('http://localhost:3000/admin/users');

    // Wait for users to load
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();

    // Verify at least one user exists
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows).toHaveCount(await userRows.count());
  });

  test('should create new user', async ({ page }) => {
    // Navigate to users page
    await page.goto('http://localhost:3000/admin/users');

    // Click create button
    await page.click('[data-testid="create-user-button"]');

    // Fill form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'testuser@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.p-toast-message-success')).toBeVisible();

    // Verify user appears in list
    await expect(page.locator('text=testuser@example.com')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Navigate to users page
    await page.goto('http://localhost:3000/admin/users');

    // Click create button
    await page.click('[data-testid="create-user-button"]');

    // Submit without filling form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});
```

### Common Mocking Patterns

#### API Mock

```typescript
export const createMockApi = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
});
```

#### Router Mock

```typescript
export const createMockRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
    },
  },
});
```

#### Store Mock

```typescript
export const createMockAuthStore = () => ({
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
});
```

---

## Test Organization

### Naming Conventions

#### Test Files
- Unit tests: `*.spec.ts` (e.g., `user.service.spec.ts`)
- E2E tests: `*.spec.ts` in `e2e/` folder (e.g., `login.spec.ts`)

#### Test Suites
- Use `describe()` for grouping related tests
- Nested `describe()` for method/feature grouping

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when found', () => {});
    it('should throw NotFoundException when not found', () => {});
  });

  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw BadRequestException for invalid email', () => {});
  });
});
```

#### Test Cases
- Use descriptive test names: `it('should [expected behavior] when [condition]')`
- Good: `it('should return 401 when token is invalid')`
- Bad: `it('test token')`

### AAA Pattern (Arrange-Act-Assert)

All tests should follow this structure:

```typescript
it('should calculate total price with discount', () => {
  // Arrange - Set up test data and mocks
  const items = [{ price: 100 }, { price: 200 }];
  const discount = 0.1;

  // Act - Execute the function being tested
  const result = calculateTotal(items, discount);

  // Assert - Verify the result
  expect(result).toBe(270); // 300 - 10% = 270
});
```

### Test Data Factories

Create reusable test data factories for consistency:

```typescript
// test/factories/user.factory.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockUserList = (count: number) => {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({ id: String(i + 1), email: `user${i}@example.com` })
  );
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: app/backend/package-lock.json

      - name: Install dependencies
        working-directory: app/backend
        run: npm ci

      - name: Run tests with coverage
        working-directory: app/backend
        run: npm run test:coverage

      - name: Check coverage thresholds
        working-directory: app/backend
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./app/backend/coverage/coverage-final.json
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: app/frontend/package-lock.json

      - name: Install dependencies
        working-directory: app/frontend
        run: npm ci

      - name: Run unit tests with coverage
        working-directory: app/frontend
        run: npm run test:coverage

      - name: Check coverage thresholds
        working-directory: app/frontend
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./app/frontend/coverage/coverage-final.json
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        working-directory: app/frontend
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          docker-compose up -d
          npm run dev &
          npx wait-on http://localhost:3000

      - name: Run E2E tests
        working-directory: app/frontend
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: app/frontend/playwright-report/
```

### Coverage Configuration

**Backend** (`app/backend/jest.config.js`):

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
};
```

**Frontend** (`app/frontend/vitest.config.ts`):

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
      exclude: [
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/types/**',
        '**/main.ts',
        '**/router/**',
      ],
    },
  },
});
```

### Pre-commit Hooks

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint

# Run tests (fast mode - unit only)
npm run test:unit

# Block commit if tests fail
if [ $? -ne 0 ]; then
  echo "Tests failed. Please fix before committing."
  exit 1
fi
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Set up testing infrastructure and cover critical paths

1. **Setup**
   - Configure Jest for backend with Prisma mocks
   - Configure Vitest for frontend
   - Set up Playwright for E2E
   - Configure coverage reporting
   - Set up CI/CD pipeline

2. **Critical Services (90% coverage)**
   - `AuthService` - authentication logic
   - `RoleService` - RBAC logic
   - `PermissionService` - authorization checks
   - `UserService` - user management
   - `JwtAuthGuard` - route protection
   - `RolesGuard` - role-based access

3. **Critical Frontend (90% coverage)**
   - `useAuth` composable
   - `useApi` composable
   - `auth` store
   - Login/Registration flows (E2E)

### Phase 2: Core Features (Week 2-3)

**Goal**: Achieve 80% coverage for all core modules

1. **Backend Services**
   - All admin services (user, role, permission, data-object)
   - Plugin management services
   - Email template services
   - Common utilities and validators

2. **Backend Controllers**
   - All admin controllers
   - Plugin controllers
   - Email controllers
   - Integration tests for all endpoints

3. **Frontend Components**
   - All admin views
   - All reusable components
   - All stores
   - All composables
   - All API services

### Phase 3: Edge Cases & Integration (Week 4)

**Goal**: Cover edge cases, error scenarios, and integration flows

1. **Error Scenarios**
   - Network failures
   - Validation errors
   - Authorization failures
   - Database errors (mocked)
   - Rate limiting

2. **Integration Tests**
   - Complete user workflows
   - Multi-step operations
   - Cross-module interactions

3. **E2E Critical Flows**
   - User registration → login → dashboard
   - Admin: user management full CRUD
   - Admin: role assignment flow
   - Plugin installation and activation
   - Data object CRUD operations

### Phase 4: Optimization & Maintenance (Ongoing)

**Goal**: Maintain high coverage as features are added

1. **Continuous Testing**
   - All new features include tests BEFORE merge
   - PR reviews check test coverage
   - CI/CD blocks PRs below 80% coverage

2. **Test Maintenance**
   - Refactor tests as code evolves
   - Remove obsolete tests
   - Update mocks when APIs change

3. **Performance Testing**
   - Test suite execution time < 2 minutes
   - E2E tests execution time < 5 minutes
   - Optimize slow tests

---

## Best Practices

### General Principles

1. **One Test, One Assertion** (when possible)
   - Focus each test on a single behavior
   - Makes failures easier to diagnose

2. **Test Behavior, Not Implementation**
   - Test what the code does, not how it does it
   - Allows refactoring without breaking tests

3. **Avoid Test Interdependence**
   - Each test should run independently
   - Use `beforeEach` to reset state

4. **Use Descriptive Names**
   - Test name should explain what's being tested
   - Include expected behavior and conditions

5. **Keep Tests Simple**
   - Tests should be easier to understand than the code they test
   - Avoid complex logic in tests

### Anti-Patterns to Avoid

❌ **Don't test implementation details**
```typescript
// Bad - testing internal implementation
expect(service['privateMethod']).toHaveBeenCalled();

// Good - testing public behavior
expect(result).toEqual(expectedOutput);
```

❌ **Don't use real database**
```typescript
// Bad - real database connection
const result = await prisma.user.findMany();

// Good - mocked Prisma
prisma.user.findMany.mockResolvedValue(mockUsers);
```

❌ **Don't skip tests**
```typescript
// Bad - skipped tests accumulate tech debt
it.skip('should handle edge case', () => {});

// Good - either fix or remove
it('should handle edge case', () => {
  // Proper test implementation
});
```

❌ **Don't use random data without seed**
```typescript
// Bad - non-deterministic tests
const randomValue = Math.random();

// Good - use fixed test data
const testValue = 0.5;
```

❌ **Don't test external libraries**
```typescript
// Bad - testing Vue Router behavior
it('should call router.push', () => {
  expect(router.push).toHaveBeenCalled();
});

// Good - test YOUR code's behavior
it('should navigate to dashboard after login', async () => {
  await login();
  expect(router.push).toHaveBeenCalledWith('/dashboard');
});
```

### Performance Considerations

1. **Parallel Execution**
   - Run independent tests in parallel
   - Configure Jest/Vitest for multi-threading

2. **Mock Heavy Operations**
   - Mock file I/O operations
   - Mock network requests
   - Mock time-consuming calculations

3. **Selective Testing**
   - Run affected tests only during development
   - Run full suite in CI/CD

4. **Test Cleanup**
   - Clear mocks after each test
   - Reset module state
   - Avoid memory leaks

### Test-Driven Development (TDD) Workflow

**Recommended workflow for new features:**

1. **Red**: Write a failing test
   ```typescript
   it('should calculate total with tax', () => {
     const result = calculateTotalWithTax(100, 0.2);
     expect(result).toBe(120);
   });
   // Test fails - function doesn't exist yet
   ```

2. **Green**: Write minimal code to pass
   ```typescript
   export function calculateTotalWithTax(amount: number, taxRate: number): number {
     return amount + (amount * taxRate);
   }
   // Test passes
   ```

3. **Refactor**: Improve code without breaking tests
   ```typescript
   export function calculateTotalWithTax(amount: number, taxRate: number): number {
     if (amount < 0 || taxRate < 0) {
       throw new Error('Amount and tax rate must be positive');
     }
     return amount * (1 + taxRate);
   }
   // Test still passes, code is better
   ```

4. **Repeat**: Add more test cases
   ```typescript
   it('should throw error for negative amount', () => {
     expect(() => calculateTotalWithTax(-100, 0.2)).toThrow();
   });
   ```

### Code Coverage Interpretation

Coverage metrics are **indicators, not goals**:

- **80% coverage** = Good starting point, shows most code is tested
- **90% coverage** = Excellent for critical paths
- **100% coverage** = Usually overkill, focus on meaningful tests

**What to focus on:**
- ✅ Business logic (services, utilities)
- ✅ Edge cases and error handling
- ✅ Public APIs and interfaces
- ✅ Critical user flows

**What to skip:**
- ❌ Type definitions (*.dto.ts, *.interface.ts)
- ❌ Database entities (Prisma models)
- ❌ Configuration files
- ❌ Main/bootstrap files

---

## Quick Reference Commands

### Backend Testing

```bash
# Run all backend tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test user.service.spec.ts

# Run tests for specific module
npm run test -- --testPathPattern=admin

# Debug tests
npm run test:debug
```

### Frontend Testing

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific E2E test
npx playwright test csrf-protection.spec.ts
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser (after generating)
# Backend: open app/backend/coverage/index.html
# Frontend: open app/frontend/coverage/index.html
```

---

## Summary

This testing strategy ensures:

1. **No database dependencies** - All tests use mocks only
2. **High coverage** - 80% minimum per file, 90% for critical services
3. **Incremental development** - Tests added one at a time, all must pass
4. **Fast execution** - Unit tests < 1s, integration < 5s
5. **CI/CD integration** - Automated testing gates all PRs
6. **Maintainability** - Simple, focused tests following AAA pattern
7. **TDD workflow** - Write tests before implementation when possible

**Key Success Metrics:**
- 80% coverage across all modules within 4 weeks
- Test suite execution < 2 minutes
- Zero skipped tests in main branch
- All PRs require passing tests before merge

**Next Steps:**
1. Set up testing infrastructure (Jest, Vitest, Playwright)
2. Configure coverage reporting and CI/CD
3. Start with Phase 1: Critical paths (auth, RBAC)
4. Follow TDD workflow for all new features
5. Review and refactor tests regularly

This strategy should be referenced for all testing decisions and maintained as patterns evolve.
