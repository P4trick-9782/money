@echo off
cd /d "C:\Users\lyc02\記帳"
git add .
git commit -m "update: %date% %time%"
git push
echo.
echo 同步完成！
pause
