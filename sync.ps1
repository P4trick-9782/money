$ErrorActionPreference = "Stop"
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $folder

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  記帳 GitHub 同步工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 確認 git 存在
try { $null = git --version } catch {
    Write-Host "[錯誤] 找不到 git，請安裝 Git for Windows" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

# 確認是 git repo
$gitDir = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[錯誤] 此資料夾不是 git 倉庫" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

# 加入所有變更
Write-Host "[1/3] 偵測變更中..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "[錯誤] git add 失敗" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

# 檢查是否有暫存的變更
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    # 有變更，執行 commit
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[2/3] 提交變更：$timestamp" -ForegroundColor Yellow
    git commit -m "update: $timestamp"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[錯誤] commit 失敗" -ForegroundColor Red
        Read-Host "按 Enter 結束"
        exit 1
    }
} else {
    Write-Host "[2/3] 無新變更，跳過 commit" -ForegroundColor Gray
}

# Push
Write-Host "[3/3] 上傳到 GitHub..." -ForegroundColor Yellow
$pushOutput = git push origin main 2>&1
Write-Host $pushOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[錯誤] push 失敗！錯誤訊息如上" -ForegroundColor Red
    Write-Host "常見原因：Token 過期，請重新產生 PAT 並更新" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  同步完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Start-Sleep -Seconds 2
