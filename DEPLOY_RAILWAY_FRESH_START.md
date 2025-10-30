# 🚀 Deploy Adaptalyfe to Railway - FRESH START

## ✅ What You Need (Already Have)
- ✅ GitHub Repo: https://github.com/Adaptalyfe/adaptalyfe-production-clean
- ✅ Neon Database: Working with 62 tables
- ✅ All environment variables ready

---

## 📋 STEP 1: Delete Old Railway Service (if exists)

1. Go to Railway Dashboard
2. Click "adaptalyfe-cache-bust" service
3. Click "Settings" → Scroll down → "Delete Service"
4. Confirm deletion

---

## 🎯 STEP 2: Create New Railway Service

### Option A: Deploy from GitHub (Recommended)

1. **Go to Railway Dashboard**
   - URL: https://railway.app

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**

4. **Choose your repo:**
   - Select: `Adaptalyfe/adaptalyfe-production-clean`

5. **Railway will auto-detect and start deploying**

---

## ⚙️ STEP 3: Configure Environment Variables

**Immediately after creation:**

1. Click on your new service
2. Click **"Variables"** tab
3. Click **"+ New Variable"** for each one below:

### Variable 1: DATABASE_URL
```
postgresql://neondb_owner:npg_UaGgd6tcZ9Fe@ep-weathered-salad-afef9mso.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Variable 2: SESSION_SECRET
```
adaptalyfe-production-secret-2025-railway-deployment-secure-key-do-not-share
```

### Variable 3: STRIPE_SECRET_KEY
```
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
```

### Variable 4: VITE_STRIPE_PUBLIC_KEY
```
pk_live_51RkYzqCFbm4JsWkEL4YEwXvXBx66vPpgIhvYKBHmX0jjYh9Yv0vZPRIPpqYFOYzW9v0Dt8bG8JGvT7oPJ005JSBt3CB
```

### Variable 5: NODE_ENV
```
production
```

---

## 🔧 STEP 4: Configure Build Settings

1. Click **"Settings"** tab
2. Scroll to **"Build & Deploy"** section
3. Set these values:

**Build Command:**
```
npm run build
```

**Start Command:**
```
node dist/index.js
```

**Root Directory:** (leave blank or `/`)

4. Click **"Save Changes"**

---

## 🚀 STEP 5: Deploy

1. Railway will automatically deploy after you add variables
2. **OR** click **"Redeploy"** button
3. **Wait 3-5 minutes** for build to complete

---

## 🧪 STEP 6: Test Deployment

### Get Your Railway URL:
1. Click **"Settings"** tab
2. Find **"Public Networking"** section
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://your-app.up.railway.app`)

### Test the Backend:
Open in browser:
```
https://your-app.up.railway.app/api/health
```

**Expected Result (✅ SUCCESS):**
```json
{
  "status": "OK",
  "environment": "production",
  "timestamp": "2025-10-30T...",
  "version": "1.0.0"
}
```

**If you see JSON with "status": "OK"** → ✅ **BACKEND IS WORKING!**

### Test the Frontend:
```
https://your-app.up.railway.app
```

Should show: Adaptalyfe login page

---

## 🎯 If It Still Doesn't Work

### Check Deploy Logs:
1. Click your service
2. Click latest deployment
3. Click **"Deploy Logs"** tab
4. Look for error messages

### Common Issues:

**Issue 1: "Cannot find module 'dist/index.js'"**
- Fix: Check Build Command is `npm run build`

**Issue 2: "SESSION_SECRET is required"**
- Fix: Verify all 5 environment variables are set

**Issue 3: Database connection error**
- Fix: Check DATABASE_URL has no extra spaces

---

## 📞 Need Help?

After deployment, test `/api/health` and tell me:
1. What URL Railway gave you
2. What you see when you open `/api/health`
3. If you see errors, share Deploy Logs screenshot

---

## ✅ Success Checklist

- [ ] Old Railway service deleted
- [ ] New Railway service created from GitHub
- [ ] All 5 environment variables added
- [ ] Build command set to `npm run build`
- [ ] Start command set to `node dist/index.js`
- [ ] Domain generated
- [ ] `/api/health` returns JSON (not HTML)
- [ ] Frontend loads at root URL

---

## 🎉 When Everything Works

Your Railway URL will be your new production URL!

**Update these places:**
1. Mobile app API URLs (if needed)
2. Firebase config (if migrating)
3. Any external services pointing to old backend

---

**Last Updated:** 2025-10-30
**Database:** Neon PostgreSQL (already setup with 62 tables)
**GitHub Repo:** https://github.com/Adaptalyfe/adaptalyfe-production-clean
