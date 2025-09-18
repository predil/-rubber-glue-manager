@echo off
echo Starting with SQLite database...

REM Start backend with SQLite (no DATABASE_URL)
start "SQLite Backend" cmd /k "set PORT=5000 && cd server && node index.js"

REM Wait for backend
timeout 3 > nul

REM Start frontend
start "Frontend React" cmd /k "cd client && npm start"

echo.
echo Backend (SQLite): http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close...
pause > nul
taskkill /f /im node.exe > nul 2>&1