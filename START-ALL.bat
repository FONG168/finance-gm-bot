@echo off
echo Checking & Starting MySQL Database...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting MySQL...
    start /b "" "C:\xampp\mysql\bin\mysqld.exe" --standalone
    timeout /t 4 /nobreak >nul
)

echo Killing any existing node instances...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Backend...
start "BACKEND" cmd /k "cd /d "%~dp0backend" && C:\xampp\php\php.exe artisan serve --port=3001"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Mini App)...
start "FRONTEND" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Cloudflare Tunnel...
start "TUNNEL" cmd /k "cd /d "%~dp0" && cloudflared.exe tunnel --url http://localhost:3000"

timeout /t 3 /nobreak >nul

echo Starting Bot...
start "BOT" cmd /k "cd /d "%~dp0bot" && npx ts-node --transpile-only src/index.ts"

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

