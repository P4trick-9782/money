@echo off
chcp 65001 >nul
title Binance 記帳同步

echo ================================
echo   記帳 GitHub 同步工具
echo ================================
echo.

:: 確認 git 存在
where git >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 找不到 git，請確認 Git for Windows 已安裝並重啟終端機
  echo 下載：https://git-scm.com/download/win
  pause
  exit /b 1
)

:: 切換到記帳資料夾
cd /d "C:\Users\lyc02\記帳"
if errorlevel 1 (
  echo [錯誤] 找不到資料夾 C:\Users\lyc02\記帳
  pause
  exit /b 1
)

:: 確認是 git repo
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 此資料夾不是 git 倉庫，請重新初始化
  pause
  exit /b 1
)

:: 加入所有變更
echo [1/3] 偵測變更中...
git add .

:: 嘗試 commit（若無變更跳過）
git diff --cached --quiet
if errorlevel 1 (
  echo [2/3] 提交變更中...
  git commit -m "update: %date% %time%"
  if errorlevel 1 (
    echo [錯誤] commit 失敗
    pause
    exit /b 1
  )
) else (
  echo [2/3] 無新變更，跳過 commit
)

:: Push 到 GitHub
echo [3/3] 上傳到 GitHub 中...
git push origin main
if errorlevel 1 (
  echo.
  echo [錯誤] push 失敗，可能原因：
  echo   - Token 已過期（請重新產生 PAT 並更新遠端網址）
  echo   - 網路問題
  pause
  exit /b 1
)

echo.
echo ================================
echo   同步完成！
echo ================================
timeout /t 3 >nul
