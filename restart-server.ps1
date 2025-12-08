# Restart Server Script
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Starting server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "Server restarted successfully!" -ForegroundColor Green
