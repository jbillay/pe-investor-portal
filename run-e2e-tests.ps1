# PE Investor Portal - E2E Test Automation Script (PowerShell)
# This script starts backend/frontend, runs tests, and generates reports

# Configuration
$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "app\backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "app\frontend"
$LOGS_DIR = Join-Path $ROOT_DIR "test-logs"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Create logs directory
if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR | Out-Null
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "PE Investor Portal - E2E Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 30
    )

    Write-Host "Waiting for $Name to be ready..." -ForegroundColor Yellow

    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ $Name is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "  Attempt $i/$MaxAttempts - waiting..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }

    Write-Host "✗ $Name failed to start after $MaxAttempts attempts" -ForegroundColor Red
    return $false
}

# Function to stop processes
function Stop-TestProcesses {
    Write-Host "`nStopping test processes..." -ForegroundColor Yellow

    # Kill processes by port
    $backendPort = 5173
    $frontendPort = 3000

    $backendProcess = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    $frontendProcess = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

    if ($backendProcess) {
        Stop-Process -Id $backendProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Stopped backend process" -ForegroundColor Green
    }

    if ($frontendProcess) {
        Stop-Process -Id $frontendProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Stopped frontend process" -ForegroundColor Green
    }

    # Also kill any node processes related to our app
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*investorPortal*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Trap to ensure cleanup on exit
trap {
    Stop-TestProcesses
    exit 1
}

# Check if services are already running
Write-Host "Checking for existing services..." -ForegroundColor Yellow
if (Test-Port 5173) {
    Write-Host "⚠ Backend is already running on port 5173" -ForegroundColor Yellow
    $response = Read-Host "Stop existing backend and continue? (y/n)"
    if ($response -eq "y") {
        Stop-TestProcesses
        Start-Sleep -Seconds 3
    } else {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# Step 1: Start Backend
Write-Host "`n[1/5] Starting Backend Server (Test Mode)..." -ForegroundColor Cyan
$backendLogFile = Join-Path $LOGS_DIR "backend_$TIMESTAMP.log"

$backendJob = Start-Job -ScriptBlock {
    param($Dir, $LogFile)
    Set-Location $Dir
    $env:NODE_ENV = "test"
    npm run start:dev 2>&1 | Tee-Object -FilePath $LogFile
} -ArgumentList $BACKEND_DIR, $backendLogFile

Write-Host "  Backend logs: $backendLogFile" -ForegroundColor Gray

# Wait for backend to be ready
Start-Sleep -Seconds 5
if (-not (Wait-ForService -Name "Backend" -Url "http://localhost:5173/health")) {
    Write-Host "`nBackend startup failed. Check logs at: $backendLogFile" -ForegroundColor Red
    Stop-TestProcesses
    exit 1
}

# Step 2: Start Frontend
Write-Host "`n[2/5] Starting Frontend Server..." -ForegroundColor Cyan
$frontendLogFile = Join-Path $LOGS_DIR "frontend_$TIMESTAMP.log"

$frontendJob = Start-Job -ScriptBlock {
    param($Dir, $LogFile)
    Set-Location $Dir
    npm run dev 2>&1 | Tee-Object -FilePath $LogFile
} -ArgumentList $FRONTEND_DIR, $frontendLogFile

Write-Host "  Frontend logs: $frontendLogFile" -ForegroundColor Gray

# Wait for frontend to be ready
Start-Sleep -Seconds 5
if (-not (Wait-ForService -Name "Frontend" -Url "http://localhost:3000")) {
    Write-Host "`nFrontend startup failed. Check logs at: $frontendLogFile" -ForegroundColor Red
    Stop-TestProcesses
    exit 1
}

# Step 3: Run E2E Tests
Write-Host "`n[3/5] Running Playwright E2E Tests..." -ForegroundColor Cyan
$testLogFile = Join-Path $LOGS_DIR "test-results_$TIMESTAMP.log"

Set-Location $FRONTEND_DIR
$env:NODE_ENV = "test"

Write-Host "  Test logs: $testLogFile" -ForegroundColor Gray
Write-Host "`nTest execution started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

npm run test:e2e 2>&1 | Tee-Object -FilePath $testLogFile

$testExitCode = $LASTEXITCODE

# Step 4: Generate HTML Report
Write-Host "`n[4/5] Generating Test Report..." -ForegroundColor Cyan
$reportDir = Join-Path $FRONTEND_DIR "playwright-report"

if (Test-Path $reportDir) {
    Write-Host "✓ HTML report generated at: $reportDir" -ForegroundColor Green
    Write-Host "  Open: file:///$($reportDir.Replace('\', '/'))/index.html" -ForegroundColor Gray
} else {
    Write-Host "⚠ No report directory found" -ForegroundColor Yellow
}

# Step 5: Generate Summary Report
Write-Host "`n[5/5] Creating Summary Report..." -ForegroundColor Cyan
$summaryFile = Join-Path $LOGS_DIR "test-summary_$TIMESTAMP.txt"

$summary = @"
====================================
PE Investor Portal - E2E Test Report
====================================

Test Run: $TIMESTAMP
Duration: $(Get-Date)

LOGS LOCATION
-------------
Backend Logs:  $backendLogFile
Frontend Logs: $frontendLogFile
Test Logs:     $testLogFile
HTML Report:   $reportDir

TEST RESULTS
------------
"@

# Extract test results from log
$testResults = Get-Content $testLogFile -Tail 50 | Out-String

if ($testResults -match "(\d+) passed") {
    $summary += "`nPassed: $($Matches[1])"
}
if ($testResults -match "(\d+) failed") {
    $summary += "`nFailed: $($Matches[1])"
}
if ($testResults -match "(\d+) flaky") {
    $summary += "`nFlaky: $($Matches[1])"
}
if ($testResults -match "(\d+) skipped") {
    $summary += "`nSkipped: $($Matches[1])"
}

$summary += "`n`nExit Code: $testExitCode"

if ($testExitCode -eq 0) {
    $summary += "`nStatus: ✓ ALL TESTS PASSED"
} else {
    $summary += "`nStatus: ✗ SOME TESTS FAILED"
}

$summary += @"

`n
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
Report generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
====================================
"@

$summary | Out-File -FilePath $summaryFile -Encoding UTF8
Write-Host "✓ Summary report created: $summaryFile" -ForegroundColor Green

# Display summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "TEST EXECUTION COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host $summary

# Cleanup
Stop-TestProcesses

Write-Host "`n✓ Test suite execution completed!" -ForegroundColor Green
Write-Host "`nTo view the HTML report, run:" -ForegroundColor Yellow
Write-Host "  cd $FRONTEND_DIR" -ForegroundColor White
Write-Host "  npx playwright show-report" -ForegroundColor White

exit $testExitCode
