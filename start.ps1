# DataPilot AI PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting DataPilot AI (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='backend'; .\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm --prefix frontend run dev"

Write-Host "Backend launching at:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend launching at: http://localhost:3000" -ForegroundColor Green
