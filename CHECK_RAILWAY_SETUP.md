# 🔍 Check Railway Setup - Quick Guide

## ✅ Your Code is Synced!

Latest code (including session timeout fix) is now on GitHub:
- **Repository:** https://github.com/Adaptalyfe/adaptalyfe-production-clean
- **Railway auto-deploys** from this repository

---

## 🔧 Step-by-Step: Verify Railway Connection

### 1️⃣ Open Railway Dashboard

Go to: **https://railway.app/dashboard**

---

### 2️⃣ Open Your Project

Look for: **`adaptalyfe-cache-bust-production`** (or similar name)

Click on it to open.

---

### 3️⃣ Check Services

You should see **2 boxes** (services):

#### Option A: ✅ If You See 2 Services:
```
┌─────────────────┐    ┌─────────────────┐
│  Your App       │    │  PostgreSQL     │
│  (Node.js)      │    │  (Database)     │
└─────────────────┘    └─────────────────┘
```
✅ **Database is connected!** → Go to Step 4

#### Option B: ❌ If You See Only 1 Service:
```
┌─────────────────┐
│  Your App       │
│  (Node.js)      │
└─────────────────┘
```
❌ **Database NOT connected** → Follow "Add Database" below

---

### 4️⃣ Check Database Connection (If Database Exists)

1. **Click your app service** (the one with Node.js)
2. **Click "Variables" tab**
3. **Look for these variables:**

```
✅ DATABASE_URL = ${{ Postgres.DATABASE_URL }}
✅ PGHOST = ${{ Postgres.PGHOST }}
✅ PGPORT = ${{ Postgres.PGPORT }}
✅ PGUSER = ${{ Postgres.PGUSER }}
✅ PGPASSWORD = ${{ Postgres.PGPASSWORD }}
✅ PGDATABASE = ${{ Postgres.PGDATABASE }}
```

**If you see these** → ✅ Database is connected!
**If you DON'T see these** → Follow "Connect Database" below

---

## 🔧 Add Database (If Missing)

### Step 1: Create PostgreSQL Service

1. In Railway dashboard, click **"+ New"** (or press `Ctrl/Cmd + K`)
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Wait 30 seconds ⏳

---

### Step 2: Connect App to Database

1. **Click your app service** (not the database)
2. **Click "Variables" tab**
3. **Click "New Variable"** and add each of these:

```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
PGHOST = ${{ Postgres.PGHOST }}
PGPORT = ${{ Postgres.PGPORT }}
PGUSER = ${{ Postgres.PGUSER }}
PGPASSWORD = ${{ Postgres.PGPASSWORD }}
PGDATABASE = ${{ Postgres.PGDATABASE }}
```

**Important:** Type exactly `${{ Postgres.DATABASE_URL }}` - this links to your database!

---

### Step 3: Import Your Data

1. **Get Railway Database URL:**
   - Click the **PostgreSQL service**
   - Go to **"Variables"** tab
   - Copy the value of **`DATABASE_PUBLIC_URL`**

2. **Import from Replit:**
   ```bash
   # In Replit terminal:
   ./migrate-to-railway-db.sh
   ./import-to-railway-db.sh 'YOUR_RAILWAY_DB_URL'
   ```

---

### Step 4: Redeploy

Railway auto-redeploys when you add variables. If not:

1. Click your app service
2. Click **"Redeploy"** button
3. Wait ~2 minutes ⏳

---

## 🧪 Test Your Setup

### 1. Check Health Endpoint

Open in browser:
```
https://adaptalyfe-cache-bust-production.up.railway.app/api/health
```

**Expected:**
```json
{
  "status": "OK",
  "environment": "production",
  "timestamp": "2025-10-30T..."
}
```

---

### 2. Check Debug Info

Open in browser:
```
https://adaptalyfe-cache-bust-production.up.railway.app/api/debug
```

**Look for:**
```json
{
  "environment": "production",
  "hasDatabase": true,  ← Should be true!
  "hasStripe": true,    ← Should be true!
  ...
}
```

---

### 3. Test Login

1. Go to: https://adaptalyfe-cache-bust-production.up.railway.app/
2. Login with: `admin` / `demo2025`
3. Check dashboard loads ✅
4. Wait 2 hours, refresh → Should still be logged in ✅ (session timeout fix)

---

## 📊 What Each Setup Means

### Current Setup (Before Migration):
```
Railway Frontend
    ↓ (HTTPS - Cross-origin)
Replit Backend (f0feebb6...spock.replit.dev)
    ↓
Neon PostgreSQL Database

❌ Issues:
- Cross-origin session problems
- 401 errors after session expires
- Slower (multiple networks)
```

### After Railway Database Migration:
```
Railway App (Frontend + Backend)
    ↓ (Private Network)
Railway PostgreSQL

✅ Benefits:
- Same origin = no session issues
- Faster (private network)
- More reliable
- Simpler to manage
```

---

## 🎯 Quick Checklist

Run through this to verify everything:

- [ ] Code synced to GitHub ✅ (DONE!)
- [ ] Railway has PostgreSQL service
- [ ] App variables include `${{ Postgres.xxx }}`
- [ ] `/api/health` returns `"status": "OK"`
- [ ] `/api/debug` shows `"hasDatabase": true`
- [ ] Login works
- [ ] Dashboard loads
- [ ] No 401 errors

---

## 🚨 Common Issues & Fixes

### Issue: "hasDatabase: false"

**Fix:** Add database environment variables:
```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
```

---

### Issue: Still getting 401 errors

**Causes:**
1. Railway hasn't deployed latest code yet (wait 2-3 min)
2. Database not connected (follow "Add Database" above)
3. Session secret changed (clear browser cookies)

**Fix:** 
- Clear cookies and re-login
- Make sure Railway deployed latest code

---

### Issue: App shows "Something went wrong"

**Check:**
1. Railway deployment logs (click "Deployments" tab)
2. `/api/health` endpoint
3. Database connection variables

---

## 📞 Next Steps

### If Database is Connected ✅
- Wait for Railway auto-deployment (~2-3 min)
- Test login and dashboard
- You're done! 🎉

### If Database NOT Connected ❌
- Follow "Add Database" section above
- Import your data
- Test everything

### For Best Results 🚀
- **Migrate to Railway PostgreSQL** (use the migration scripts)
- **Eliminates all cross-origin issues**
- **Takes 10 minutes, fixes everything permanently**

---

## 📋 Summary

**What's Done:**
- ✅ Code synced to GitHub
- ✅ Session timeout extended (7 days)
- ✅ Railway auto-deploying latest code

**What to Check:**
- Is Railway PostgreSQL service created?
- Are database variables configured?
- Does `/api/health` work?
- Does login work without 401 errors?

**Best Next Step:**
- Follow the migration guide to move database to Railway
- Consolidate everything in one place
- Solve 401 errors permanently

---

**🎯 Recommendation:** Even if your current setup works, migrating to Railway PostgreSQL is the best long-term solution!
