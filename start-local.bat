@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo  Starting Aleta Hidase School Website
echo ===================================================

:: 1. Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Create a default .env file if it doesn't exist (prevents crash on first run)
if not exist ".env" (
    echo Creating default .env file...
    echo PORT=3000 > .env
    echo JWT_SECRET=my-secret-key-change-me >> .env
    echo ADMIN_USERNAME=admin >> .env
    echo ADMIN_PASSWORD=adminpassword123 >> .env
)

:: 3. Check if dependencies are installed, if not, install them
if not exist "node_modules" (
    echo.
    echo [1/2] Installing dependencies. This might take a minute...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 4. Start the server
echo.
echo [2/2] Starting server...
echo.

:: Run the server with the experimental SQLite flag and env file
set NODE_OPTIONS=--experimental-sqlite
node --env-file=.env server.js

:: 5. PAUSE so the window doesn't close if it crashes
echo.
echo ===================================================
echo  The server has stopped. Please screenshot any errors above.
echo ===================================================
pause