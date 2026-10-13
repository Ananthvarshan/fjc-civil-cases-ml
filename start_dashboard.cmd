@echo off
cd /d "%~dp0"
python -m uvicorn website.backend.dashboard_app:app --host 127.0.0.1 --port 8000
pause
