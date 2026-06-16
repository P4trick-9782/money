@echo off
chcp 65001 >nul
title 記帳 GitHub 同步
set LOGFILE=%~dp0sync_log.txt
echo ================================ > "%LOGFILE%"
echo 同步時間：%date% %time% >> "%LOGFILE%"
echo ================================ >> "%LOGFILE%"

echo ================================
echo   記帳 GitHub 同步工具
echo ================================
echo.

:: 確認 git 存在
where git >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 找不到 git >> "%LOGFILE%"
  echo [錯誤] 找不到 git，請確認 Git for Windows 已安裝
  pause & exit /b 1
)

:: 切換到記帳資料夾
cd /d "%~dp0"
echo 工作目錄：%CD% >> "%LOGFILE%"

:: 確認是 git repo
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 不是 git 倉庫 >> "%LOGFILE%"
  echo [錯誤] 此資料夾不是 git 倉庫
  pause & exit /b 1
)

:: 加入所有變更
echo [1/3] 偵測變更中...
git add -A >> "%LOGFILE%" 2>&1

:: 檢查是否有需要 commit 的內容（add 之後再檢查）
git diff --cached --quiet
if errorlevel 1 (
  echo [2/3] 提交變更中...
  git commit -m "update: %date% %time%" >> "%LOGFILE%" 2>&1
  if errorlevel 1 (
    echo [錯誤] commit 失敗，請查看 sync_log.txt
    echo [錯誤] commit 失敗 >> "%LOGFILE%"
    start notepad "%LOGFILE%"
    pause & exit /b 1
  )
  echo commit 完成 >> "%LOGFILE%"
) else (
  echo [2/3] 無新變更，跳過 commit
  echo 無新變更 >> "%LOGFILE%"
)

:: Push 到 GitHub
echo [3/3] 上傳到 GitHub 中...
git push origin main >> "%LOGFILE%" 2>&1
if errorlevel 1 (
  echo.
  echo [錯誤] push 失敗！
  echo 可能原因：Token 過期（需重新產生 PAT）或網路問題
  echo 詳細錯誤請查看 sync_log.txt
  echo [錯誤] push 失敗 >> "%LOGFILE%"
  start notepad "%LOGFILE%"
  pause & exit /b 1
)

echo push 成功 >> "%LOGFILE%"
echo.
echo ================================
echo   同步完成！
echo ================================
timeout /t 3 >nul
