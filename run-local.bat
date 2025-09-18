@echo off
echo Starting Rubber Glue Manager locally...
echo.

echo Installing dependencies...
cd server
call npm install
cd ..\client
call npm install
cd ..

echo.
echo Starting servers...
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.

start "Backend Server" cmd /k "cd server && set PORT=5000 && npm start"
timeout /t 3
start "Frontend Server" cmd /k "cd client && set HOST=0.0.0.0 && npm start"

echo.
echo Both servers are starting...
echo Your app will open in browser shortly.
pause