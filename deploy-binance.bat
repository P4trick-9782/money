@echo off
cd /d "%~dp0"
where supabase
supabase functions deploy binance-proxy --project-ref gyrzdjfbdjepxszuwisk --no-verify-jwt
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync.ps1"
pause
