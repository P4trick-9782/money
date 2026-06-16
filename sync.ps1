$ErrorActionPreference = "Stop"
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $folder

Write-Host "=== Git Sync Tool ===" -ForegroundColor Cyan

# Check git
try { $null = git --version } catch {
    Write-Host "[ERROR] git not found. Please install Git for Windows." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check git repo
git rev-parse --git-dir 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not a git repository." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Stage all changes
Write-Host "[1/3] Staging changes..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] git add failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Commit if there are changes
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[2/3] Committing: $timestamp" -ForegroundColor Yellow
    git commit -m "update: $timestamp"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Commit failed." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[2/3] Nothing to commit, skipping." -ForegroundColor Gray
}

# Push
Write-Host "[3/3] Pushing to GitHub..." -ForegroundColor Yellow
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
git push origin main
$exitCode = $LASTEXITCODE
$ErrorActionPreference = $prev

if ($exitCode -ne 0) {
    Write-Host "[ERROR] Push failed. Token may have expired." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "=== Done! ===" -ForegroundColor Green
Start-Sleep -Seconds 2
