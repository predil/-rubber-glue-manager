@echo off
echo Starting Rubber Glue Management System locally...

REM Start backend with PostgreSQL
start "Backend Server" cmd /k "set DATABASE_URL=postgresql://neondb_owner:npg_HXA5qJ8vUzMr@ep-plain-grass-adei6n9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require && set PORT=5000 && cd server && node index.js"

REM Wait a moment for backend to start
timeout 3 > nul

REM Start frontend
start "Frontend React" cmd /k "cd client && npm start"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close both servers...
pause > nul

REM Kill the servers
taskkill /f /im node.exe > nul 2>&1