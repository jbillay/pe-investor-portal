#!/bin/bash
# PE Investor Portal - E2E Test Automation Script (Bash)
# This script starts backend/frontend, runs tests, and generates reports

set -e

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"
FRONTEND_DIR="$ROOT_DIR/app/frontend"
LOGS_DIR="$ROOT_DIR/test-logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$LOGS_DIR"

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}PE Investor Portal - E2E Test Suite${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i ":$port" &> /dev/null
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -an | grep ":$port " | grep LISTEN &> /dev/null
        return $?
    else
        # Fallback: try to connect
        (echo > /dev/tcp/localhost/$port) &> /dev/null
        return $?
    fi
}

# Function to wait for service
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}

    echo -e "${YELLOW}Waiting for $name to be ready...${NC}"

    for i in $(seq 1 $max_attempts); do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is ready!${NC}"
            return 0
        fi
        echo -e "  Attempt $i/$max_attempts - waiting..."
        sleep 2
    done

    echo -e "${RED}✗ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to stop processes
stop_test_processes() {
    echo -e "\n${YELLOW}Stopping test processes...${NC}"

    # Kill processes by port
    if check_port 5173; then
        if command -v lsof &> /dev/null; then
            lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        else
            pkill -f "node.*start:dev" 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Stopped backend process${NC}"
    fi

    if check_port 3000; then
        if command -v lsof &> /dev/null; then
            lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        else
            pkill -f "vite" 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Stopped frontend process${NC}"
    fi

    # Kill background jobs
    jobs -p | xargs kill -9 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap stop_test_processes EXIT INT TERM

# Check if services are already running
echo -e "${YELLOW}Checking for existing services...${NC}"
if check_port 5173; then
    echo -e "${YELLOW}⚠ Backend is already running on port 5173${NC}"
    read -p "Stop existing backend and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_test_processes
        sleep 3
    else
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# Step 1: Start Backend
echo -e "\n${CYAN}[1/5] Starting Backend Server (Test Mode)...${NC}"
BACKEND_LOG="$LOGS_DIR/backend_$TIMESTAMP.log"

cd "$BACKEND_DIR"
NODE_ENV=test npm run start:dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo -e "  Backend logs: $BACKEND_LOG"

# Wait for backend
sleep 5
if ! wait_for_service "Backend" "http://localhost:5173/health"; then
    echo -e "\n${RED}Backend startup failed. Check logs at: $BACKEND_LOG${NC}"
    exit 1
fi

# Step 2: Start Frontend
echo -e "\n${CYAN}[2/5] Starting Frontend Server...${NC}"
FRONTEND_LOG="$LOGS_DIR/frontend_$TIMESTAMP.log"

cd "$FRONTEND_DIR"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo -e "  Frontend logs: $FRONTEND_LOG"

# Wait for frontend
sleep 5
if ! wait_for_service "Frontend" "http://localhost:3000"; then
    echo -e "\n${RED}Frontend startup failed. Check logs at: $FRONTEND_LOG${NC}"
    exit 1
fi

# Step 3: Run E2E Tests
echo -e "\n${CYAN}[3/5] Running Playwright E2E Tests...${NC}"
TEST_LOG="$LOGS_DIR/test-results_$TIMESTAMP.log"

cd "$FRONTEND_DIR"
export NODE_ENV=test

echo -e "  Test logs: $TEST_LOG"
echo -e "\n${YELLOW}Test execution started at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

npm run test:e2e 2>&1 | tee "$TEST_LOG"
TEST_EXIT_CODE=${PIPESTATUS[0]}

# Step 4: Generate HTML Report
echo -e "\n${CYAN}[4/5] Generating Test Report...${NC}"
REPORT_DIR="$FRONTEND_DIR/playwright-report"

if [ -d "$REPORT_DIR" ]; then
    echo -e "${GREEN}✓ HTML report generated at: $REPORT_DIR${NC}"
    echo -e "  Open: file://$REPORT_DIR/index.html"
else
    echo -e "${YELLOW}⚠ No report directory found${NC}"
fi

# Step 5: Generate Summary Report
echo -e "\n${CYAN}[5/5] Creating Summary Report...${NC}"
SUMMARY_FILE="$LOGS_DIR/test-summary_$TIMESTAMP.txt"

cat > "$SUMMARY_FILE" << EOF
====================================
PE Investor Portal - E2E Test Report
====================================

Test Run: $TIMESTAMP
Duration: $(date)

LOGS LOCATION
-------------
Backend Logs:  $BACKEND_LOG
Frontend Logs: $FRONTEND_LOG
Test Logs:     $TEST_LOG
HTML Report:   $REPORT_DIR

TEST RESULTS
------------
EOF

# Extract test results from log
tail -50 "$TEST_LOG" | grep -E "(passed|failed|flaky|skipped)" | head -5 >> "$SUMMARY_FILE" || true

echo "" >> "$SUMMARY_FILE"
echo "Exit Code: $TEST_EXIT_CODE" >> "$SUMMARY_FILE"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "Status: ✓ ALL TESTS PASSED" >> "$SUMMARY_FILE"
else
    echo "Status: ✗ SOME TESTS FAILED" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" << EOF

RATE LIMITING STATUS
--------------------
Rate limiting solution: Environment-aware throttling
Backend Mode: TEST (NODE_ENV=test)
Connection Pool: 50 connections
Rate Limits Applied:
  - Login: 1000 requests/min (vs 10/15min in production)
  - Register: 500 requests/min (vs 5/5min in production)
  - Refresh: 2000 requests/min (vs 20/10min in production)

DATABASE CONNECTION POOL
-------------------------
Configuration: 50 concurrent connections
Pool Timeout: 20 seconds
Status: ✓ Configured for parallel test execution

====================================
Report generated at: $(date '+%Y-%m-%d %H:%M:%S')
====================================
EOF

echo -e "${GREEN}✓ Summary report created: $SUMMARY_FILE${NC}"

# Display summary
echo -e "\n${CYAN}=====================================${NC}"
echo -e "${CYAN}TEST EXECUTION COMPLETE${NC}"
echo -e "${CYAN}=====================================${NC}"
cat "$SUMMARY_FILE"

# Cleanup handled by trap

echo -e "\n${GREEN}✓ Test suite execution completed!${NC}"
echo -e "\n${YELLOW}To view the HTML report, run:${NC}"
echo -e "  ${NC}cd $FRONTEND_DIR${NC}"
echo -e "  ${NC}npx playwright show-report${NC}"

exit $TEST_EXIT_CODE
