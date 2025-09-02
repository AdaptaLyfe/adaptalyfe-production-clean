# Railway Troubleshooting - Step by Step

## The Problem
Railway forced redeploy still serves old JavaScript file, indicating Railway configuration issue.

## Step-by-Step Railway Fixes

### Step 1: Verify Railway Settings
1. **Railway Dashboard** → Your project → **Settings**
2. **Build Command**: Should be `npm run build`
3. **Start Command**: Should be `node dist/index.js`
4. **Root Directory**: Should be `/` or blank

### Step 2: Check Git Integration
1. **Settings** → **GitHub Integration**
2. **Repository**: Verify it's `AdaptaLyfe/adaptalyfe-production-clean`
3. **Branch**: Verify it's `main` (or correct branch)
4. **Auto-Deploy**: Should be enabled

### Step 3: Clear All Railway Cache
1. **Environment Variables** → Add:
   - `RAILWAY_REBUILD_CACHE=true`
   - `NODE_ENV=production`
   - `FORCE_FRESH_BUILD=true`
2. **Save** and **Redeploy**

### Step 4: Check Deployment Logs
1. **Deployments** tab
2. Click latest deployment
3. Look for build errors or warnings
4. Verify `npm run build` completed successfully

### Step 5: Nuclear Option - Recreate Railway Service
If nothing works:
1. Create new Railway service
2. Connect to same GitHub repo
3. Configure same environment variables
4. Deploy fresh

## What to Look For in Logs
- ✅ `npm run build` - success
- ✅ Files copied to dist/public/
- ✅ Server starting on port 5000
- ❌ Any build errors or cache warnings

## Expected Result
After successful Railway rebuild with fresh cache:
- New JavaScript file name (not `index-D_VnzE2d.js`)
- Smart backend detection active
- app.adaptalyfeapp.com loads properly