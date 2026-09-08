# Railway PostgreSQL Migration Guide

## 🎯 Goal
Migrate Adaptalyfe database from Replit/Neon PostgreSQL to Railway PostgreSQL

---

## 📋 Step 1: Create PostgreSQL Database on Railway

### A. In Railway Dashboard

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open your project**: `adaptalyfe-cache-bust-production`
3. **Add PostgreSQL**:
   - Click **"+ New"** or press `Ctrl/Cmd + K`
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Wait for deployment (~30 seconds)

### B. Get Railway Database Credentials

1. Click on the **PostgreSQL service** (purple icon)
2. Go to **"Variables"** tab
3. You'll see these variables automatically created:
   - `DATABASE_URL` (use this for your app)
   - `DATABASE_PUBLIC_URL` (for local connections)
   - `DATABASE_PRIVATE_URL` (for Railway internal)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

4. **Copy the `DATABASE_PUBLIC_URL`** - you'll need this for the migration

---

## 📋 Step 2: Export Current Replit Database

### On Replit Terminal:

```bash
# Export current database to a dump file
pg_dump "$DATABASE_URL" -Fc -b -v -f adaptalyfe_backup.dump

# Verify the dump file was created
ls -lh adaptalyfe_backup.dump
```

**Expected output:**
```
-rw-r--r-- 1 runner runner 2.5M Oct 30 15:45 adaptalyfe_backup.dump
```

---

## 📋 Step 3: Import to Railway Database

### Option A: Using pg_restore (Recommended)

```bash
# Set your Railway DATABASE_PUBLIC_URL
RAILWAY_DB_URL="postgresql://postgres:PASSWORD@containers-us-west-xx.railway.app:PORT/railway"

# Import the dump to Railway
pg_restore -d "$RAILWAY_DB_URL" -v adaptalyfe_backup.dump

# Verify tables were created
psql "$RAILWAY_DB_URL" -c "\dt"
```

### Option B: Export as SQL and Import

```bash
# Export as SQL
pg_dump "$DATABASE_URL" > adaptalyfe_backup.sql

# Import to Railway
psql "$RAILWAY_DB_URL" -f adaptalyfe_backup.sql
```

---

## 📋 Step 4: Update Railway Environment Variables

### In Railway Dashboard:

1. **Go to your Railway project**
2. **Click on your main service** (the one with your Node.js app)
3. **Go to "Variables" tab**
4. **Add/Update these variables:**

   ```
   DATABASE_URL = ${{ Postgres.DATABASE_URL }}
   PGHOST = ${{ Postgres.PGHOST }}
   PGPORT = ${{ Postgres.PGPORT }}
   PGUSER = ${{ Postgres.PGUSER }}
   PGPASSWORD = ${{ Postgres.PGPASSWORD }}
   PGDATABASE = ${{ Postgres.PGDATABASE }}
   ```

   **Note:** The `${{ Postgres.xxx }}` syntax automatically references your PostgreSQL service variables!

5. **Keep your existing Stripe variables:**
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`

---

## 📋 Step 5: Verify Database Schema

After import, connect to Railway database and verify:

```bash
# Connect to Railway database
psql "$RAILWAY_DB_URL"

# List all tables
\dt

# Check user count
SELECT COUNT(*) FROM "User";

# Check tasks count  
SELECT COUNT(*) FROM "DailyTask";

# Exit
\q
```

---

## 📋 Step 6: Redeploy Your Railway App

Your Railway app will automatically redeploy when you add the environment variables. If not:

1. Go to Railway dashboard
2. Click your service
3. Click **"Redeploy"** button

---

## 📋 Step 7: Test the Deployed App

1. **Open**: https://adaptalyfe-cache-bust-production.up.railway.app/
2. **Login** with existing credentials: `admin` / `demo2025`
3. **Verify**:
   - ✅ Dashboard loads
   - ✅ Tasks are visible
   - ✅ All data is present
   - ✅ Can create new tasks

---

## 🔧 Troubleshooting

### Error: "relation does not exist"

**Fix:** Run Drizzle migrations on Railway database:

```bash
# Set Railway database URL
export DATABASE_URL="<your-railway-db-url>"

# Push schema to Railway database
npm run db:push
```

### Error: "connection refused"

**Fix:** Make sure you're using `DATABASE_PUBLIC_URL` for external connections

### Error: "password authentication failed"

**Fix:** Copy credentials exactly from Railway Variables tab (no extra spaces)

---

## 📊 Quick Reference

| Environment | Database URL |
|-------------|-------------|
| **Replit/Neon** | `postgresql://neondb_owner:***@ep-weathered-salad-afef9mso.c-2.us-west-2.aws.neon.tech/neondb` |
| **Railway** | `postgresql://postgres:***@containers-us-west-xx.railway.app:PORT/railway` |

---

## ✅ Success Checklist

- [ ] PostgreSQL created on Railway
- [ ] Database exported from Replit
- [ ] Database imported to Railway
- [ ] Environment variables updated on Railway
- [ ] App redeployed
- [ ] Login works
- [ ] Data is visible
- [ ] New data can be created

---

## 🚨 Important Notes

1. **Use variable references**: `${{ Postgres.DATABASE_URL }}` instead of hardcoding
2. **Private vs Public URLs**: 
   - Use `DATABASE_URL` in your Railway app (private network, no egress fees)
   - Use `DATABASE_PUBLIC_URL` for local development or external tools
3. **Backup**: Keep the `adaptalyfe_backup.dump` file safe until migration is confirmed working

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway build logs
2. Check Railway deployment logs  
3. Verify environment variables are set correctly
4. Test database connection with `psql`
