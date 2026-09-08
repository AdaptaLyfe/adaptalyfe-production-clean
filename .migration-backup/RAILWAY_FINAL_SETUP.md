# Railway Deployment - Final Configuration Guide

## 🎯 Root Cause of Previous Failures

**Problem:** Railway sets `NODE_ENV=production` during builds, causing `npm ci` to skip devDependencies (vite, esbuild). When the build tried to run these tools, they weren't available.

**Solution:** Force npm to install devDependencies during build by setting `NPM_CONFIG_PRODUCTION=false`.

---

## ✅ Step-by-Step Railway Setup

### 1️⃣ Environment Variables (Railway Dashboard → Variables Tab)

Add these **6 variables**:

```
DATABASE_URL = <your-neon-postgresql-url>
SESSION_SECRET = <random-secret-key>
STRIPE_SECRET_KEY = <your-stripe-secret>
VITE_STRIPE_PUBLIC_KEY = <your-stripe-public>
NODE_ENV = production
NPM_CONFIG_PRODUCTION = false
```

**⚠️ CRITICAL:** `NPM_CONFIG_PRODUCTION=false` ensures vite and esbuild are installed during builds!

---

### 2️⃣ Railway Service Settings

**Settings Tab:**
- ✅ Builder: NIXPACKS (automatic)
- ✅ Build Command: (leave blank - uses nixpacks.toml)
- ✅ Start Command: (leave blank - uses nixpacks.toml)
- ✅ Root Directory: (leave blank)
- ✅ Port: (leave blank - auto-detects from PORT env var)

---

### 3️⃣ Deploy Configuration Files

**nixpacks.toml** (PRIMARY CONFIG):
```toml
[variables]
NODE_ENV = "production"
NPM_CONFIG_PRODUCTION = "false"

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = [
  "npm run build",
  "npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js"
]

[start]
cmd = "node dist/production.js"
```

**railway.toml** (MINIMAL - just health checks):
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[[deploy.healthcheck]]
httpPath = "/api/health"
initialDelaySeconds = 30
periodSeconds = 10
timeoutSeconds = 5
failureThreshold = 3
```

---

### 4️⃣ Clear Build Cache & Redeploy

**Before redeploying:**
1. Go to Settings → Scroll to "Danger Zone"
2. Click **"Clear Build Cache"**
3. Confirm

**Then redeploy:**
1. Go to Deployments tab
2. Click **"Redeploy"** button
3. Wait 3-5 minutes

---

## 🧪 Verification Checklist

After deployment shows "Active":

### ✅ Health Check
```
https://adaptalyfe-production-clean-production.up.railway.app/api/health
```
Expected:
```json
{"status":"OK","environment":"production","timestamp":"2025-10-31T..."}
```

### ✅ Frontend
```
https://adaptalyfe-production-clean-production.up.railway.app
```
Expected: Adaptalyfe login page

### ✅ Build Logs Should Show
```
✅ Running: npm ci
✅ Installing ALL packages (including devDependencies)
✅ Running: npm run build
✅ vite v5.x.x building for production...
✅ ✓ built in XXXms
✅ Running: npx esbuild server/production.ts
✅ dist/production.js  XXX.Xkb
✅ Build complete!
```

---

## 🔧 Troubleshooting

### If build still fails:
1. Check Build Logs for the exact error
2. Verify `NPM_CONFIG_PRODUCTION=false` is set in Variables tab
3. Clear build cache again
4. Redeploy

### If health check fails:
1. Check Deploy Logs for runtime errors
2. Verify all 6 environment variables are set
3. Check DATABASE_URL is correct Neon PostgreSQL URL

---

## 📋 Complete Environment Variables List

```env
# Database
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require

# Session
SESSION_SECRET=your-random-secret-here

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx

# Build & Runtime
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

---

## 🎉 Success Criteria

✅ Build logs show all tools (vite, esbuild) running
✅ Deploy logs show "Starting Container" with no errors
✅ /api/health returns JSON with status "OK"
✅ Frontend loads login page
✅ Database queries work (Neon PostgreSQL)
✅ Sessions persist (7-day rolling sessions)

---

**Last Updated:** October 31, 2025
**Status:** Production-ready configuration
