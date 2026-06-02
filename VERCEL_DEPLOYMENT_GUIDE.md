# Vercel Deployment Guide for Smart Code Editor

## Problem Fixed ✅
The share button wasn't working because the frontend was trying to connect to:
- **`localhost:5000`** (hardcoded in development environment)
- But on Vercel, the backend is on a different domain

## Solution Applied

### 1. **Fixed Frontend Code**
All frontend API calls now use the `REACT_APP_BACKEND_URL` environment variable:
- `App.js` - Share and AI endpoints
- `SharePage.jsx` - Share retrieval 
- `HistoryModal.jsx` - History fetching
- `Login.jsx` - Auth endpoints

### 2. **How It Works Now**
```javascript
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? `${window.location.protocol}//${window.location.hostname}/api`
    : `${window.location.protocol}//${window.location.hostname}:5000`
  );
```

This means:
- **Development**: Uses `http://localhost:5000` if `REACT_APP_BACKEND_URL` is not set
- **Production**: Uses environment variable if available, otherwise falls back to `/api` on same domain

## Deployment Steps

### For Vercel (Recommended)

#### Option A: Deploy as Separate Services (Easiest)

1. **Deploy Backend First**
   ```bash
   cd backend
   vercel deploy
   ```
   - Copy your backend URL (e.g., `https://smart-code-editor-api.vercel.app`)

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel deploy \
     --env REACT_APP_BACKEND_URL=https://smart-code-editor-api.vercel.app
   ```

3. **Or set Environment variable in Vercel Dashboard**:
   - Go to your Frontend project settings on Vercel
   - Add Environment Variable:
     - Key: `REACT_APP_BACKEND_URL`
     - Value: `https://your-backend-url.vercel.app`

#### Option B: Deploy from Monorepo (Root `vercel.json`)

1. Link root folder to Vercel (uses `vercel.json` config)
2. Set Backend URL Environment Variable in Vercel Dashboard:
   - Key: `backend_url`
   - Value: `https://your-backend-url.vercel.app`

## Testing the Share Feature

1. Go to your deployed app at `https://your-app.vercel.app`
2. Write or paste some code
3. Click "Share" button
4. The share link should be copied and should look like:
   ```
   https://your-app.vercel.app/share/abc123
   ```
5. Open the share link in a new browser/incognito window
6. The code should load correctly on the share page

## Troubleshooting

### Share Links Return 404 or Error
- **Cause**: Backend URL not configured correctly
- **Fix**: 
  1. Check Vercel Dashboard → Environment Variables
  2. Verify `REACT_APP_BACKEND_URL` is set to correct backend URL
  3. Redeploy frontend after changing env variables

### "Failed to share: Network error"
- **Cause**: Frontend can't reach backend
- **Fix**:
  1. Open browser DevTools → Network tab
  2. Check the failed API request URL
  3. Verify backend is running and accessible from that URL
  4. Check CORS configuration in `backend/server.js`

### Shared Code Loads but Shows Empty
- **Cause**: Backend database/connection issue
- **Fix**:
  1. Verify MongoDB connection in backend
  2. Check backend logs in Vercel: Project → Deployments → Logs
  3. Ensure shared code was actually saved to MongoDB

## Files Modified

1. **frontend/src/App.js** - Uses `API_BASE_URL` for all API calls
2. **frontend/src/pages/SharePage.jsx** - Uses environment variable for backend URL
3. **frontend/src/components/HistoryModal.jsx** - Uses environment variable
4. **frontend/src/pages/Login.jsx** - Uses environment variable  
5. **vercel.json** - Updated for Vercel deployment
6. **frontend/.env.example** - Configuration template

## Local Development

To test locally:

```bash
# Terminal 1 - Start Backend
cd backend
npm start
# Runs on http://localhost:5000

# Terminal 2 - Start Frontend
cd frontend
npm start
# Runs on http://localhost:3000
```

The frontend will automatically use `http://localhost:5000` for API calls when running locally.

## Backend CORS Configuration

Make sure your backend `server.js` has proper CORS settings:

```javascript
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-app.vercel.app'],
  credentials: true
}));
```

This allows the frontend to make requests to the backend.
