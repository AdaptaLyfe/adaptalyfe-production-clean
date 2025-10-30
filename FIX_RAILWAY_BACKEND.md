# 🔧 Fix Railway Backend - Step by Step Guide

## 🚨 The Problem

Your Railway is **only serving static frontend files**, the backend Express server is NOT running!

**Evidence:**
```
Railway Frontend calls: f0feebb6...spock.replit.dev/api/...
                        ↑
                  This is REPLIT backend, not Railway!
```

This causes cross-origin session issues → 401 errors!

---

## ✅ Solution: Configure Railway to Run Backend

### Step 1: Open Railway Dashboard

1. Go to: **https://railway.app/dashboard**
2. Click your **Adaptalyfe project**
3. Click the **service** (your app box)

---

### Step 2: Check Settings

Click **Settings** tab and scroll down:

#### A. Check "Start Command"

Look for: **"Start Command"** or **"Custom Start Command"**

**Should be:**
```
npm run start
```

**If it's:**
- ❌ Blank → Set it to `npm run start`
- ❌ `npm run dev` → Change to `npm run start`
- ❌ Something else → Change to `npm run start`

**How to set it:**
1. Click **"Edit"** or **"Add Variable"** next to Start Command
2. Type: `npm run start`
3. Click **"Save"**

---

#### B. Check "Build Command"

Look for: **"Build Command"**

**Should be:**
```
npm run build
```

**If it's blank or different:**
1. Click **"Edit"**
2. Type: `npm run build`
3. Click **"Save"**

---

### Step 3: Check Environment Variables

Click **"Variables"** tab:

**Required variables:**

```
NODE_ENV = production
```

**Database (choose ONE):**

Option A: Using Railway PostgreSQL (recommended)
```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
PGHOST = ${{ Postgres.PGHOST }}
PGPORT = ${{ Postgres.PGPORT }}
PGUSER = ${{ Postgres.PGUSER }}
PGPASSWORD = ${{ Postgres.PGPASSWORD }}
PGDATABASE = ${{ Postgres.PGDATABASE }}
```

Option B: Using Neon Database (current setup)
```
DATABASE_URL = postgresql://your-neon-url
```

**Payment (required for your app):**
```
STRIPE_SECRET_KEY = sk_...
VITE_STRIPE_PUBLIC_KEY = pk_...
```

**Optional but recommended:**
```
SESSION_SECRET = (random string - generate one)
OPENAI_API_KEY = (for AdaptAI chatbot)
```

---

### Step 4: Redeploy

After making changes:

1. Railway should **auto-redeploy**
2. If not, click **"Redeploy"** button (usually at the top right)
3. Wait ~2-3 minutes for deployment

---

### Step 5: Verify Backend is Running

**Test 1: Health Check**

Open in browser:
```
https://adaptalyfe-cache-bust-production.up.railway.app/api/health
```

**Expected (✅ Backend working):**
```json
{
  "status": "OK",
  "environment": "production",
  "timestamp": "2025-10-30T..."
}
```

**Wrong (❌ Backend NOT working):**
```html
<!DOCTYPE html>
<html lang="en">
...
```

---

**Test 2: Debug Endpoint**

Open in browser:
```
https://adaptalyfe-cache-bust-production.up.railway.app/api/debug
```

**Expected (✅ Backend working):**
```json
{
  "environment": "production",
  "hasDatabase": true,
  "hasStripe": true,
  ...
}
```

---

### Step 6: Check Deployment Logs

In Railway dashboard:

1. Click your **service**
2. Click **"Deployments"** tab
3. Click the **latest deployment**
4. Check the **logs**

**Look for:**

✅ **Good signs:**
```
Building...
npm run build
✓ built in ...
Starting...
npm run start
Server running on port 3000
Health check endpoint ready at /api/health
```

❌ **Bad signs:**
```
Error: Cannot find module
ENOENT: no such file or directory
Port already in use
```

---

## 🎯 Quick Checklist

After configuration, verify:

- [ ] Start Command = `npm run start`
- [ ] Build Command = `npm run build`
- [ ] `NODE_ENV = production` in Variables
- [ ] Database URL configured (Railway or Neon)
- [ ] Stripe keys configured
- [ ] Redeployed successfully
- [ ] `/api/health` returns JSON (not HTML)
- [ ] `/api/debug` returns JSON with app info
- [ ] Login works without 401 errors

---

## 🚨 Common Issues

### Issue 1: Still Getting HTML from /api/health

**Cause:** Railway is serving static files only

**Fix:**
1. Double-check Start Command is `npm run start`
2. Check deployment logs for errors
3. Make sure `dist/index.js` file exists after build

---

### Issue 2: "Module not found" errors

**Cause:** Build didn't complete successfully

**Fix:**
1. Check Build Command is `npm run build`
2. Look at build logs for errors
3. Make sure `package.json` is synced to GitHub

---

### Issue 3: Still calling Replit backend

**Cause:** Old cached frontend or build

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Redeploy on Railway
4. Check if latest code is on GitHub

---

## 📊 Architecture After Fix

**Before (❌ Broken):**
```
Railway → Only static files
    ↓
Frontend calls → Replit backend
    ↓
Cross-origin sessions → 401 errors
```

**After (✅ Fixed):**
```
Railway → Frontend + Backend together
    ↓
Same origin → No session issues!
    ↓
Database (Railway or Neon)
```

---

## 🎯 Next Steps

1. **Configure Railway** (Settings + Variables)
2. **Redeploy**
3. **Test /api/health** (should return JSON)
4. **Test login** (should work without 401)
5. **Celebrate!** 🎉

---

## 💡 Pro Tip: Migrate to Railway PostgreSQL

For the BEST results:

1. Add Railway PostgreSQL service
2. Use `${{ Postgres.DATABASE_URL }}` syntax
3. Everything in one network = faster + more reliable
4. Follow: `RAILWAY_SETUP_QUICKSTART.md`

---

**Once you configure these settings and redeploy, your backend will run on Railway and all 401 errors will be gone!** 🚀
