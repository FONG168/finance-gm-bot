@echo off
echo Killing any existing instances...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo Starting Backend...
start "BACKEND" cmd /k "cd /d "%~dp0backend" && npx ts-node-dev --respawn --transpile-only src/index.ts"

timeout /t 4 /nobreak >nul

echo Starting Bot...
start "BOT" cmd /k "cd /d "%~dp0bot" && npx ts-node --transpile-only src/index.ts"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Mini App)...
start "FRONTEND" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Admin Panel...
start "ADMIN" cmd /k "cd /d "%~dp0admin" && npm run dev"

echo.
echo All services started in separate windows!
echo - Backend:      http://localhost:3001
echo - Frontend:     http://localhost:3000  (Telegram Mini App)
echo - Admin Panel:  http://localhost:3002  (Admin Dashboard)
echo - Bot:          polling Telegram
echo.
pause
