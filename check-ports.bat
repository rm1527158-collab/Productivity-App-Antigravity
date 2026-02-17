@echo off
echo ============================================
echo   Port Availability Checker
echo ============================================
echo.

echo Checking if required ports are available...
echo.

echo [Backend Port: 5000]
netstat -ano | findstr :5000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ❌ Port 5000 is OCCUPIED
    echo    To see what's using it: netstat -ano ^| findstr :5000
    echo    You may need to change PORT in server\.env
) else (
    echo ✅ Port 5000 is AVAILABLE
)

echo.
echo [Frontend Port: 5173]
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 5173 is OCCUPIED
    echo    Vite will automatically use the next available port
    echo    To see what's using it: netstat -ano ^| findstr :5173
) else (
    echo ✅ Port 5173 is AVAILABLE
)

echo.
echo ============================================
echo   Other commonly used development ports:
echo ============================================
echo.

for %%p in (3000 3001 4000 8000 8080) do (
    netstat -ano | findstr :%%p | findstr LISTENING >nul
    if !errorlevel! equ 0 (
        echo Port %%p: OCCUPIED
    ) else (
        echo Port %%p: Available
    )
)

echo.
echo ============================================
echo Press any key to exit...
pause >nul
