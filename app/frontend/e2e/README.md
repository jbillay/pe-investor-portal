# E2E Tests for PE Investor Portal Frontend

This directory contains end-to-end (e2e) tests for the frontend application using Playwright.

## Test Structure

```
e2e/
├── fixtures/           # Test data and user fixtures
│   └── users.ts       # Test user credentials
├── utils/             # Test utilities and helpers
│   ├── auth.ts        # Authentication helpers
│   └── test-setup.ts  # Extended test fixtures
├── auth.spec.ts                    # Login and authentication tests
├── admin-users.spec.ts             # Admin user management tests
├── admin-roles.spec.ts             # Admin role management tests
├── admin-email-templates.spec.ts   # Admin email template tests
└── README.md                       # This file
```

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Login page display and validation
- Successful login with valid credentials
- Login failure with invalid credentials
- Password visibility toggle
- Session persistence
- Remember me functionality
- Redirect to intended page after login

### Admin User Management Tests (`admin-users.spec.ts`)
- Access control (super admin only)
- Page layout and navigation
- User list display and filtering
- Search functionality
- User invitation
- Edit user
- Role assignment
- Bulk operations
- Pagination and responsive design

### Admin Role Management Tests (`admin-roles.spec.ts`)
- Access control (super admin only)
- Page layout and navigation
- Role list display
- Create new role
- Edit existing role
- Delete custom roles (system roles protected)
- Permission management
- Search and filter roles
- Responsive design

### Admin Email Templates Tests (`admin-email-templates.spec.ts`)
- Access control (super admin only)
- Page layout with tabs (Templates, Logs, Statistics, Queue)
- Template list display and filtering
- Create new template
- Edit existing template
- Preview template
- Duplicate template
- Delete template (system templates protected)
- Search and filter templates
- Tab navigation
- Pagination and sorting
- Responsive design

## Running the Tests

### Prerequisites

1. Ensure both frontend and backend services are running:
   ```bash
   # Backend (default port: 5173)
   cd app/backend
   npm run start:dev

   # Frontend (default port: 3000)
   cd app/frontend
   npm run dev
   ```

2. Ensure test database is seeded with test users (see `fixtures/users.ts`)

### Run All Tests

```bash
cd app/frontend
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Specific Test File

```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only admin users tests
npx playwright test admin-users.spec.ts

# Run only admin roles tests
npx playwright test admin-roles.spec.ts

# Run only email templates tests
npx playwright test admin-email-templates.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Specific Browser

```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit
```

### Debug Tests

```bash
# Debug mode
npx playwright test --debug

# Debug specific test
npx playwright test auth.spec.ts --debug
```

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Test Configuration

The Playwright configuration is located in `playwright.config.ts` with the following settings:

- **Base URL**: http://localhost:3000 (dev), http://localhost:4173 (preview)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Headless**: Only in CI mode

## Test User Fixtures

Test users are defined in `e2e/fixtures/users.ts`:

- **SUPER_ADMIN_USER**: For testing admin features
- **INVESTOR_USER**: For testing standard user features
- **FUND_MANAGER_USER**: For testing fund management features
- **NO_ROLE_USER**: For testing unauthorized access
- **INVALID_CREDENTIALS**: For testing login failures

## Authentication Helpers

The `e2e/utils/auth.ts` file provides helper functions:

- `login(page, credentials)`: Login via UI form
- `loginWithTokens(page, authData)`: Fast login by setting tokens
- `logout(page)`: Logout user
- `isAuthenticated(page)`: Check if user is authenticated
- `getStoredUser(page)`: Get user data from localStorage
- `clearAuthData(page)`: Clear all authentication data

## Extended Test Fixtures

The `e2e/utils/test-setup.ts` provides custom fixtures:

- `authenticatedPage`: Auto-login as super admin
- `investorPage`: Auto-login as investor
- `fundManagerPage`: Auto-login as fund manager

### Using Custom Fixtures

```typescript
import { test, expect } from './utils/test-setup'

test('should access admin page', async ({ authenticatedPage: page }) => {
  // Page is already authenticated as super admin
  await page.goto('/admin/users')
  // ... test code
})
```

## Best Practices

1. **Use Helpers**: Use authentication helpers instead of manual login in each test
2. **Custom Fixtures**: Use custom fixtures for tests requiring authentication
3. **Wait Strategies**: Use `waitForSelector`, `waitForURL`, or `waitForLoadState` instead of arbitrary timeouts
4. **Selectors**: Prefer data-testid attributes, then semantic selectors, then CSS selectors
5. **Assertions**: Use Playwright's built-in assertions (expect) for better error messages
6. **Cleanup**: Tests should be independent and not rely on previous test state
7. **Parallelization**: Tests run in parallel by default; ensure they don't interfere with each other

## Troubleshooting

### Tests Failing Locally

1. **Check services are running**: Ensure both frontend (3000) and backend (5173) are running
2. **Clear browser state**: Run tests in clean state with `--headed` to debug
3. **Check test data**: Ensure test users exist in the database
4. **Network issues**: Check for CORS or network errors in the browser console

### Slow Tests

1. **Use token-based auth**: Use `loginWithTokens` instead of UI login for faster tests
2. **Reduce timeouts**: Adjust wait timeouts in selectors
3. **Run fewer browsers**: Test on Chromium only during development

### Flaky Tests

1. **Add proper waits**: Replace `waitForTimeout` with proper wait strategies
2. **Check for race conditions**: Ensure API calls complete before assertions
3. **Increase timeout**: Some operations may need more time on slower machines

## CI/CD Integration

Tests are configured to run in CI with:
- Headless mode enabled
- 2 retries for flaky tests
- HTML reporter for results
- Sequential execution (workers: 1)

Example GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use descriptive test names that explain what is being tested
3. Group related tests using `test.describe()`
4. Add comments for complex test logic
5. Keep tests focused and atomic
6. Update this README if adding new test files or utilities

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)
