@echo off
echo Starting Rubber Glue Manager...
echo.

echo Starting backend server...
cd server
start "Backend" cmd /k "npm start"
cd ..

echo Waiting 3 seconds for backend to start...
timeout /t 3

echo Starting frontend...
cd client
start "Frontend" cmd /k "npm start"
cd ..

echo.
echo ✅ Both servers are starting!
echo 🌐 Backend: http://localhost:5000
echo 🖥️  Frontend: http://localhost:3000
echo.
echo Your browser will open automatically.
pause