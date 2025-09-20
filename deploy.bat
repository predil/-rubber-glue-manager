@echo off
echo 🚀 Deploying Rubber Glue Manager...

echo.
echo 📦 Building client...
cd client
call npm run build
cd ..

echo.
echo ✅ Build complete! 
echo.
echo 🌐 Next steps:
echo 1. Push to GitHub: git add . && git commit -m "Deploy" && git push
echo 2. Vercel will auto-deploy frontend
echo 3. Render will auto-deploy backend
echo.
echo 📱 Your app will be live at:
echo Frontend: https://your-app.vercel.app
echo Backend: https://your-app.onrender.com
pause