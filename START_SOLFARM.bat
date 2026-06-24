@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js and npm are required.
  echo Install the LTS version from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing SolFarm packages...
  call npm install
  if errorlevel 1 (
    echo.
    echo Package installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo Starting SolFarm at http://localhost:5173/
echo Keep this window open while playing.
echo.
call npm run dev -- --host 0.0.0.0

