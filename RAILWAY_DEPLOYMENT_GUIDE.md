# Railway Custom Domain - Deployment Guide

## ✅ **Issue Fixed in Code**
I've implemented smart backend detection that will fix the blank white page on app.adaptalyfeapp.com.

## What Was Changed
Modified `client/src/lib/config.ts` to detect the domain:
- **Firebase domain** (adaptalyfe-5a1d3.web.app): Uses Replit backend
- **Railway domain** (app.adaptalyfeapp.com): Uses local Railway backend

## 🔄 **Railway Deployment Required**
The fix is complete in the code, but Railway needs to rebuild with the new version.

### Option 1: Automatic Deployment (If Git Connected)
If Railway is connected to your Git repository, push the changes:
```bash
git add .
git commit -m "Fix Railway custom domain backend detection"
git push
```

### Option 2: Manual Railway Dashboard
1. Go to Railway dashboard
2. Find your Adaptalyfe project  
3. Click "Deploy" or "Redeploy"
4. Wait for build to complete

### Option 3: Environment Variable Method
In Railway dashboard, add a dummy environment variable to trigger rebuild:
- Name: `REBUILD_TRIGGER`
- Value: `$(date)` or any value
- Save changes to trigger automatic rebuild

## 🎯 **Expected Result After Deployment**
When visiting https://app.adaptalyfeapp.com:
- ✅ Frontend loads properly (no blank page)
- ✅ API calls go to Railway backend (not Replit)
- ✅ Authentication works with same-domain cookies
- ✅ Full app functionality available

## 🔍 **Verification Steps**
1. Visit https://app.adaptalyfeapp.com
2. Open browser console (F12)
3. Look for: `🏠 Window hostname: app.adaptalyfeapp.com`
4. Look for: `🌐 API Call: /api/user → /api/user` (no external URL)

The blank white page issue will be resolved once Railway rebuilds with this fix.