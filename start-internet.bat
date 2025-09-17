@echo off
echo Starting Rubber Glue Manager for Internet Access...

echo.
echo Starting Backend Server...
start "Backend" cmd /k "cd server && node index.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd client && npm start"

timeout /t 10 /nobreak >nul

echo.
echo Creating Internet Tunnels...
echo Backend tunnel (API):
start "Backend Tunnel" cmd /k "ngrok http 5000"

timeout /t 3 /nobreak >nul

echo Frontend tunnel (Website):
start "Frontend Tunnel" cmd /k "ngrok http 3000"

echo.
echo ========================================
echo Your app is now accessible on the internet!
echo.
echo 1. Wait for ngrok tunnels to start (about 10 seconds)
echo 2. Copy the HTTPS URLs from the ngrok windows
echo 3. Update your .env file with the backend URL
echo 4. Share the frontend URL with others
echo ========================================
pause