# 🚀 Deploy Rubber Glue Manager to Free Hosting

## Backend Deployment (Railway)

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: your webApp repository
5. **Choose**: server folder
6. **Deploy** - Railway will auto-detect Node.js

**Your API URL**: `https://your-app-name.railway.app`

## Frontend Deployment (Vercel)

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. **Click**: "New Project"
4. **Import**: your webApp repository
5. **Root Directory**: client
6. **Environment Variables**:
   - `REACT_APP_API_URL` = `https://your-app-name.railway.app`
7. **Deploy**

**Your Website URL**: `https://your-app-name.vercel.app`

## Alternative: Netlify + Render

### Backend (Render)
1. **Go to**: https://render.com
2. **New Web Service** from GitHub
3. **Root Directory**: server
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`

### Frontend (Netlify)
1. **Go to**: https://netlify.com
2. **New site from Git**
3. **Base directory**: client
4. **Build command**: `npm run build`
5. **Publish directory**: client/build
6. **Environment**: `REACT_APP_API_URL=https://your-app.onrender.com`

## 📱 Access Your App
- **Website**: Share the Vercel/Netlify URL
- **Login**: admin / admin123
- **Mobile**: Works on any device with internet

## 🔧 Update App
1. **Make changes** to your code
2. **Git push** to update automatically
3. **Both sites** will redeploy automatically