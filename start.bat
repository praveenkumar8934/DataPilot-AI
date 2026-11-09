@echo off
echo ===================================================
echo Starting DataPilot AI (Backend + Frontend)
echo ===================================================

echo [1/2] Starting FastAPI Backend on port 8000...
start "DataPilot AI - FastAPI Backend" cmd /k "venv\Scripts\activate.bat && set PYTHONPATH=backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend on port 3000...
start "DataPilot AI - Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo DataPilot AI is booting up!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:3000
echo ===================================================
