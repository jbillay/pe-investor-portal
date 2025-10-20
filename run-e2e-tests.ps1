# PE Investor Portal - E2E Test Automation Script
# Starts backend/frontend in TEST mode, runs tests, generates reports
$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "app\backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "app\frontend"
$LOGS_DIR = Join-Path $ROOT_DIR "test-logs"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR | Out-Null
}
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "PE Investor Portal - E2E Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
function Test-Port {
    param($Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -ne $connection
    }
    catch {
        return $false
    }
}
function Wait-ForService {
    param([string]$Name, [string]$Url, [int]$MaxAttempts = 30)
    Write-Host "Waiting for $Name to be ready..." -ForegroundColor Yellow
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] $Name is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "  Attempt $i/$MaxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "[FAIL] $Name failed to start" -ForegroundColor Red
    return $false
}
function Stop-TestProcesses {
    Write-Host "`nStopping test processes..." -ForegroundColor Yellow
    $backendProc = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    $frontendProc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($backendProc) {
        Stop-Process -Id $backendProc -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Stopped backend" -ForegroundColor Green
    }
    if ($frontendProc) {
        Stop-Process -Id $frontendProc -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Stopped frontend" -ForegroundColor Green
    }
}
trap {
    Stop-TestProcesses
    exit 1
}
Write-Host "Checking for existing services..." -ForegroundColor Yellow
if (Test-Port 5173) {
    Write-Host "[WARNING] Port 5173 already in use" -ForegroundColor Yellow
    $response = Read-Host "Stop and restart? (y/n)"
    if ($response -eq "y") {
        Stop-TestProcesses
        Start-Sleep -Seconds 3
    } else {
        exit 1
    }
}
Write-Host "`n[1/5] Starting Backend (TEST MODE)..." -ForegroundColor Cyan
$backendLogFile = Join-Path $LOGS_DIR "backend_$TIMESTAMP.log"
$backendJob = Start-Job -ScriptBlock {
    param($Dir, $LogFile)
    Set-Location $Dir
    $env:NODE_ENV = "test"
    npm run start:dev 2>&1 | Tee-Object -FilePath $LogFile
} -ArgumentList $BACKEND_DIR, $backendLogFile
Write-Host "  Logs: $backendLogFile" -ForegroundColor Gray
Write-Host "  Mode: TEST" -ForegroundColor Gray
Start-Sleep -Seconds 10
if (-not (Wait-ForService -Name "Backend" -Url "http://localhost:5173/health")) {
    Write-Host "`nBackend failed. Check: $backendLogFile" -ForegroundColor Red
    Stop-TestProcesses
    exit 1
}
Write-Host "`n[2/5] Starting Frontend..." -ForegroundColor Cyan
$frontendLogFile = Join-Path $LOGS_DIR "frontend_$TIMESTAMP.log"
$frontendJob = Start-Job -ScriptBlock {
    param($Dir, $LogFile)
    Set-Location $Dir
    npm run dev 2>&1 | Tee-Object -FilePath $LogFile
} -ArgumentList $FRONTEND_DIR, $frontendLogFile
Write-Host "  Logs: $frontendLogFile" -ForegroundColor Gray
Start-Sleep -Seconds 10
if (-not (Wait-ForService -Name "Frontend" -Url "http://localhost:3000")) {
    Write-Host "`nFrontend failed. Check: $frontendLogFile" -ForegroundColor Red
    Stop-TestProcesses
    exit 1
}
Write-Host "`n[3/5] Running E2E Tests..." -ForegroundColor Cyan
$testLogFile = Join-Path $LOGS_DIR "test-results_$TIMESTAMP.log"
Set-Location $FRONTEND_DIR
$env:NODE_ENV = "test"
Write-Host "  Logs: $testLogFile" -ForegroundColor Gray
Write-Host "  Started: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
Write-Host "  Tests: 100 (Chromium only)" -ForegroundColor Yellow
Write-Host ""
npm run test:e2e 2>&1 | Tee-Object -FilePath $testLogFile
$testExitCode = $LASTEXITCODE
Write-Host "`n[4/5] Checking Report..." -ForegroundColor Cyan
$reportDir = Join-Path $FRONTEND_DIR "playwright-report"
if (Test-Path $reportDir) {
    Write-Host "[OK] Report: $reportDir" -ForegroundColor Green
}
Write-Host "`n[5/5] Creating Summary..." -ForegroundColor Cyan
$summaryFile = Join-Path $LOGS_DIR "test-summary_$TIMESTAMP.txt"
$testResults = Get-Content $testLogFile -Tail 50 | Out-String
$summary = "PE Investor Portal - E2E Test Report`n"
$summary += "====================================`n`n"
$summary += "Test Run: $TIMESTAMP`n"
$summary += "Backend: $backendLogFile`n"
$summary += "Frontend: $frontendLogFile`n"
$summary += "Tests: $testLogFile`n"
$summary += "Report: $reportDir`n`n"
if ($testResults -match "(\d+) passed") { $summary += "Passed: $($Matches[1])`n" }
if ($testResults -match "(\d+) failed") { $summary += "Failed: $($Matches[1])`n" }
if ($testResults -match "(\d+) flaky") { $summary += "Flaky: $($Matches[1])`n" }
if ($testResults -match "(\d+) skipped") { $summary += "Skipped: $($Matches[1])`n" }
$summary += "`nExit: $testExitCode`n"
$summary += "Status: " + $(if ($testExitCode -eq 0) { "PASSED" } else { "FAILED" }) + "`n`n"
$summary += "Mode: TEST (NODE_ENV=test)`n"
$summary += "Browser: Chromium`n"
$summary += "Tests: 100`n"
$summary | Out-File -FilePath $summaryFile -Encoding UTF8
Write-Host "[OK] Summary: $summaryFile" -ForegroundColor Green
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host $summary
Stop-TestProcesses
Write-Host "`n[OK] Done!" -ForegroundColor Green
Write-Host "`nView report: cd $FRONTEND_DIR; npx playwright show-report" -ForegroundColor Yellow
exit $testExitCode
