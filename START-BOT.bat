@echo off
title Kh Smart Finance GM - BOT
color 0A
echo ==========================================
echo   Kh Smart Finance GM - Telegram Bot
echo ==========================================
echo.
cd /d "%~dp0bot"
echo Starting bot...
npx ts-node --transpile-only src/index.ts
echo.
echo Bot stopped. Press any key to restart...
pause
