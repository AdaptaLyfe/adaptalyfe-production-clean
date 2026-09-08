# 🚀 Railway PostgreSQL Setup - Quick Start Guide

**Goal:** Connect Railway deployment to Railway PostgreSQL database

---

## ⚡ Quick Steps (5 minutes)

### 1️⃣ Export Your Current Database

```bash
# Run this in Replit terminal
./migrate-to-railway-db.sh
```

This creates: `adaptalyfe_backup_YYYYMMDD_HHMMSS.dump`

---

### 2️⃣ Create PostgreSQL on Railway

1. **Go to**: https://railway.app/dashboard
2. **Open project**: `adaptalyfe-cache-bust-production`
3. **Add database**:
   - Click `+ New` (or press `Ctrl/Cmd + K`)
   - Select `Database`
   - Choose `Add PostgreSQL`
   - Wait 30 seconds ⏳

---

### 3️⃣ Get Railway Database URL

1. Click the **PostgreSQL service** (purple icon)
2. Go to **Variables** tab
3. **Copy** the value of `DATABASE_PUBLIC_URL`

It looks like:
```
postgresql://postgres:dr75i6HaC0sDZDTjtLCt@containers-us-west-37.railway.app:6233/railway
```

---

### 4️⃣ Import Your Data to Railway

```bash
# Run this in Replit terminal (replace with your actual Railway URL)
./import-to-railway-db.sh 'postgresql://postgres:PASSWORD@containers-us-west-XX.railway.app:PORT/railway'
```

**Expected output:** ✅ Import Complete!

---

### 5️⃣ Connect Your App to Railway Database

1. **Go to Railway** → Your **app service** (not Postgres)
2. Click **Variables** tab
3. **Add these variables** (click "New Variable" for each):

```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
PGHOST = ${{ Postgres.PGHOST }}
PGPORT = ${{ Postgres.PGPORT }}
PGUSER = ${{ Postgres.PGUSER }}
PGPASSWORD = ${{ Postgres.PGPASSWORD }}
PGDATABASE = ${{ Postgres.PGDATABASE }}
```

**Important:** Use the exact syntax `${{ Postgres.xxx }}` - this references your PostgreSQL service!

4. **Keep your existing Stripe keys:**
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`

---

### 6️⃣ Redeploy Your App

Railway auto-redeploys when you add variables. If not:

1. Click your app service
2. Click **"Redeploy"** button
3. Wait ~2 minutes ⏳

---

### 7️⃣ Test It! 🎉

1. **Open**: https://adaptalyfe-cache-bust-production.up.railway.app/
2. **Login**: `admin` / `demo2025`
3. **Check**:
   - ✅ Dashboard loads
   - ✅ Tasks visible
   - ✅ Data is there
   - ✅ Can create new items

---

## 🎯 What This Does

| Before | After |
|--------|-------|
| Railway app → Replit backend → Neon database | Railway app → Railway backend → Railway database |
| Split deployment (3 services) | **All-in-one Railway deployment** |
| External database (Neon) | Native Railway PostgreSQL |

---

## ✅ Success Checklist

- [ ] Exported current database (`.dump` file exists)
- [ ] Created PostgreSQL on Railway (purple icon visible)
- [ ] Imported data successfully (no errors)
- [ ] Added environment variables with `${{ Postgres.xxx }}` syntax
- [ ] App redeployed (check Railway dashboard)
- [ ] Login works at Railway URL
- [ ] All data visible

---

## 🆘 Troubleshooting

### ❌ "command not found: pg_dump"
**Install PostgreSQL client:**
```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

### ❌ "relation does not exist" after import
**Run Drizzle migrations:**
```bash
DATABASE_URL='<railway-db-url>' npm run db:push
```

### ❌ Can't connect to Railway database
- Use `DATABASE_PUBLIC_URL` for external access
- Use `DATABASE_URL` (private) for Railway services

---

## 📞 Need Help?

1. Check **Railway build logs** (click service → Deployments)
2. Check **Railway runtime logs** (click service → Logs)
3. Verify **environment variables** are set correctly
4. Test database connection: `psql '<railway-db-url>' -c '\dt'`

---

## 📚 Full Documentation

See `RAILWAY_DATABASE_MIGRATION.md` for detailed steps and troubleshooting.
