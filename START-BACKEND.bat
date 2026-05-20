@echo off
title Kh Smart Finance GM - BACKEND API
color 0B
echo ==========================================
echo   Kh Smart Finance GM - Backend API
echo ==========================================
echo.
cd /d "%~dp0backend"
echo Starting backend on port 3001...
npx ts-node-dev --respawn --transpile-only src/index.ts
echo.
pause
