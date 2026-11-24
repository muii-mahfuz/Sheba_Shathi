@echo off
setlocal

cd /d "%~dp0"

where pnpm >nul 2>&1
if errorlevel 1 (
  echo pnpm is required. Install pnpm, then run this file again.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing project dependencies...
  call pnpm install
  if errorlevel 1 exit /b 1
)

echo Starting Sheba Shathi at http://localhost:3100
call pnpm exec next dev --port 3100
