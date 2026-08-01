@echo off
title Kh Smart Finance GM - BOT
color 0A
echo ==========================================
echo   Kh Smart Finance GM - Telegram Bot
echo ==========================================
echo.
echo Checking MySQL Database...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting MySQL Database...
    start /b "" "C:\xampp\mysql\bin\mysqld.exe" --standalone
    timeout /t 3 /nobreak >nul
)
cd /d "%~dp0bot"
echo Starting bot...
npx ts-node --transpile-only src/index.ts
echo.
echo Bot stopped. Press any key to restart...
pause
