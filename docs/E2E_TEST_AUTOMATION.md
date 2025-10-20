# E2E Test Automation Guide

## Overview

Automated scripts for running end-to-end tests with comprehensive logging and reporting.

## Features

✅ **Automated Service Management**
- Starts backend in test mode with relaxed rate limits
- Starts frontend development server
- Waits for services to be healthy before running tests
- Automatic cleanup on exit or failure

✅ **Comprehensive Logging**
- Backend logs saved to file
- Frontend logs saved to file
- Test execution logs saved to file
- All logs timestamped and organized

✅ **Test Reporting**
- Playwright HTML report generation
- Summary report with test statistics
- Rate limiting configuration details
- Database connection pool status

✅ **Environment Configuration**
- Sets `NODE_ENV=test` for backend
- Applies relaxed rate limits (1000 login requests/min)
- Configures 50 database connections for parallel tests
- Cross-platform compatibility (Windows & Unix)

## Scripts

### Windows (PowerShell)

```powershell
.\run-e2e-tests.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh
```

## What the Script Does

### 1. Pre-flight Checks
- Checks if backend/frontend are already running
- Prompts to stop existing services if found
- Creates `test-logs` directory if it doesn't exist

### 2. Start Backend (Test Mode)
- Launches backend with `NODE_ENV=test`
- Logs output to `test-logs/backend_TIMESTAMP.log`
- Waits for health check at `http://localhost:5173/health`
- Applies relaxed rate limits:
  - Login: 1000 requests/minute
  - Register: 500 requests/minute
  - Refresh: 2000 requests/minute

### 3. Start Frontend
- Launches frontend dev server
- Logs output to `test-logs/frontend_TIMESTAMP.log`
- Waits for service at `http://localhost:3000`

### 4. Run Playwright Tests
- Executes `npm run test:e2e` in frontend directory
- Logs test output to `test-logs/test-results_TIMESTAMP.log`
- Runs all 300 E2E tests across 6 parallel workers

### 5. Generate Reports
- **HTML Report**: `app/frontend/playwright-report/index.html`
  - Interactive test results with screenshots and traces
  - View with: `npx playwright show-report`

- **Summary Report**: `test-logs/test-summary_TIMESTAMP.txt`
  - Test statistics (passed/failed/flaky/skipped)
  - Log file locations
  - Configuration details
  - Exit status

### 6. Cleanup
- Automatically stops backend and frontend processes
- Runs on script exit, interrupt (Ctrl+C), or error

## Output Structure

```
test-logs/
├── backend_2025-10-20_14-30-00.log
├── frontend_2025-10-20_14-30-00.log
├── test-results_2025-10-20_14-30-00.log
└── test-summary_2025-10-20_14-30-00.txt

app/frontend/playwright-report/
├── index.html
├── data/
└── trace/
```

## Viewing Reports

### HTML Report (Interactive)

```bash
cd app/frontend
npx playwright show-report
```

Opens an interactive report in your browser with:
- Test execution timeline
- Screenshots of failures
- Network requests
- Console logs
- Test traces

### Summary Report (Text)

```bash
cat test-logs/test-summary_LATEST.txt
```

Quick overview of test results and configuration.

## Exit Codes

- `0` - All tests passed
- `1` - Some tests failed or error occurred

## Troubleshooting

### Port Already in Use

**Error**: `Backend is already running on port 5173`

**Solution**:
- Script will prompt to stop existing services
- Answer `y` to proceed
- Or manually stop services:
  ```powershell
  # Windows
  Stop-Process -Name "node" -Force

  # Linux/Mac
  pkill -f node
  ```

### Services Won't Start

**Check logs**:
```bash
# Backend logs
cat test-logs/backend_LATEST.log

# Frontend logs
cat test-logs/frontend_LATEST.log
```

**Common issues**:
1. **Database not running**: Start PostgreSQL
2. **Dependencies not installed**: Run `npm install` in backend and frontend
3. **Port conflicts**: Check if other services are using ports 5173 or 3000

### Tests Timing Out

**Causes**:
- Backend not ready (check health endpoint)
- Database connection issues
- Rate limiting (should be solved with test mode)

**Check**:
1. Backend health: `curl http://localhost:5173/health`
2. Database status: `docker ps | grep postgres`
3. Backend logs for connection errors

## Configuration

### Connection Pool Size

Configured in `app/backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db?connection_limit=50&pool_timeout=20
```

Adjust `connection_limit` if you change Playwright workers:
- Formula: `(num_workers * 2) + 10`
- 6 workers = 22 minimum, 50 recommended

### Rate Limits

Configured in `app/backend/src/auth/auth.controller.ts`:
```typescript
@Throttle({
  default: {
    limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
    ttl: process.env.NODE_ENV === 'test' ? 60000 : 900000
  }
})
```

### Test Parallelization

Configured in `app/frontend/playwright.config.ts`:
```typescript
workers: process.env.CI ? 1 : 6
```

Adjust based on your system resources.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: PeInvestors
          POSTGRES_USER: PeInvestors_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd app/backend && npm install
          cd ../frontend && npm install

      - name: Run E2E tests
        run: ./run-e2e-tests.sh

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-logs/
            app/frontend/playwright-report/
```

## Best Practices

1. **Before Running Tests**:
   - Ensure database is running
   - Ensure all dependencies are installed
   - Close other applications using ports 5173 or 3000

2. **Regular Testing**:
   - Run before committing changes
   - Run full suite before pull requests
   - Review failed test screenshots

3. **Log Management**:
   - Review logs after failures
   - Archive logs periodically
   - Clean old logs: `rm -rf test-logs/*`

4. **Performance**:
   - Run tests on a machine with sufficient RAM (8GB+ recommended)
   - Close resource-intensive applications during tests
   - Adjust worker count based on CPU cores

## Quick Reference

```bash
# Run automated test suite
./run-e2e-tests.ps1  # Windows
./run-e2e-tests.sh   # Unix

# View HTML report
cd app/frontend && npx playwright show-report

# View summary
cat test-logs/test-summary_*.txt | tail -50

# Clean logs
rm -rf test-logs/*

# Stop services manually
# Windows:
Stop-Process -Name "node" -Force

# Unix:
pkill -f node
```

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs in `test-logs/` directory
3. Verify database and services are running
4. Check `docs/RATE_LIMITING.md` for rate limit configuration

---

**Last Updated**: 2025-10-20
**Maintained By**: Development Team
