@echo off
echo Starting VexonAC Panel...

start "Server (3000)" cmd /k "cd /d %~dp0apps\server && bun run dev"
timeout /t 3 /nobreak >nul
start "Ingress API (3002)" cmd /k "cd /d %~dp0apps\ingress-api && bun run dev"
timeout /t 3 /nobreak >nul
start "Web (3001)" cmd /k "cd /d %~dp0apps\web && bun run dev"

echo All services started. Open http://localhost:3001
