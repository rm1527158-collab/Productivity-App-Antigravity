@echo off
echo ============================================
echo   Productivity App - Quick Start
echo ============================================
echo.

echo [1/2] Seeding Database with Sample Data...
echo.
cd server
call npm run seed
cd ..
timeout /t 2 /nobreak >nul

echo.
echo [2/2] Launching Guardian Server Monitor...
echo.
echo (This will keep both Backend and Frontend running indefinitely)
echo.
node guardian.js

echo.
echo ============================================
echo   All services started!
echo ============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: Check the Vite terminal for URL
echo.
echo Press any key to exit this window...
pause >nul
