@echo off
title Kh Smart Finance GM - BACKEND API
color 0B
echo ==========================================
echo   Kh Smart Finance GM - Backend API
echo ==========================================
echo.
cd /d "%~dp0backend"
echo Starting backend on port 3001...
C:\xampp\php\php.exe artisan serve --port=3001
echo.
pause
