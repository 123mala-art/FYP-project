# Quick Vercel Deployment Guide (Web Method - No CLI Needed!)

## 🚀 Fastest Way: GitHub Auto-Deploy

This is the EASIEST method - Vercel automatically deploys when you push to GitHub.

### Steps:

#### 1. **Push Your Code to GitHub**
```powershell
cd "c:\Users\ahtas\OneDrive\Desktop\fyp project\smart-code-editor"
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

#### 2. **Deploy Backend on Vercel (Web Dashboard)**

1. Go to: https://vercel.com/new
2. Click **"Add GitHub Org or Personal Account"** (if not connected)
3. Select your repo: `smart-code-editor`
4. Choose **"Monorepo"** or **"Other"**
5. **Framework Preset**: Select **"Other"** (it's Node.js)
6. **Root Directory**: Leave blank or set to `./`
7. **Override for root**: 
   - Build Command: Leave blank (or `npm install`)
   - Output Directory: `.`
8. Click **Deploy**

#### 3. **Deploy Frontend on Vercel**

1. Go to: https://vercel.com/new
2. Select your repo again
3. **Framework Preset**: Select **"Create React App"**
4. **Root Directory**: `./frontend`
5. **Environment Variables**: Click "Add Variables"
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-backend-project-name.vercel.app`
6. Click **Deploy**

---

## Manual Setup (If GitHub not connected)

### Without GitHub:

1. **Install Vercel CLI locally** (fix permission issue):
   ```powershell
   npm install vercel --save-dev
   ```

2. **Login to Vercel**:
   ```powershell
   npx vercel login
   ```

3. **Deploy Backend**:
   ```powershell
   cd backend
   npx vercel deploy
   # Copy the URL shown
   ```

4. **Deploy Frontend**:
   ```powershell
   cd ../frontend
   npx vercel deploy --env REACT_APP_BACKEND_URL=https://your-backend-url.vercel.app
   ```

---

## What You'll Get:

After deployment, your URLs will be:
- **Frontend**: `https://smart-code-editor.vercel.app`
- **Backend**: `https://smart-code-editor-api.vercel.app`

The share button will work because the frontend can now reach your backend!

---

## Troubleshooting Deployment

### If backend deployment fails:
- Check `backend/vercel.json` is correct ✅
- Check `backend/server.js` exists ✅
- Ensure MongoDB connection string is in environment variables

### If frontend won't build:
- Clear cache: `cd frontend && npm cache clean --force`
- Reinstall: `npm install`
- Build locally first: `npm run build`

### If share feature still doesn't work:
1. Open DevTools (F12) → Network tab
2. Click Share button
3. Check the API URL being called
4. Verify it matches your backend URL in Vercel

---

## How to Check Deployment Status

1. Go to https://vercel.com/dashboard
2. Click your project
3. See all deployments under "Deployments" tab
4. Check logs if there are build errors
