@echo off
setlocal
cd /d "%~dp0"

set "MINDTRACE_NODE=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "MINDTRACE_PNPM=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
set "MINDTRACE_URL=http://127.0.0.1:5173"

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 goto :open

if not exist "node_modules\vite\bin\vite.js" (
  echo Dang cai dat thu vien MindTrace...
  call "%MINDTRACE_PNPM%" install
  if errorlevel 1 goto :failed
)

if not exist ".env.local" (
  echo Thieu file .env.local. Hay cau hinh Supabase truoc khi khoi dong.
  pause
  exit /b 1
)

echo Dang khoi dong MindTrace o che do nen...
powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%MINDTRACE_NODE%' -ArgumentList @('node_modules\vite\bin\vite.js','--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory '%CD%' -WindowStyle Hidden"
timeout /t 3 /nobreak >nul

:open
start "" "%MINDTRACE_URL%"
exit /b 0

:failed
echo Khong the khoi dong MindTrace. Vui long giu cua so nay va kiem tra loi ben tren.
pause
exit /b 1
