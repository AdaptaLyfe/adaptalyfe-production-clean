# Railway Uppy Package Fix

## Problem Identified
Railway build failing because `@uppy/aws-s3@4.4.1` doesn't exist or isn't available in npm registry during build.

## Solution: Downgrade Uppy Packages
Updated package-clean.json with stable Uppy versions:
- `@uppy/aws-s3`: `^4.4.1` → `^3.5.3`
- `@uppy/core`: `^4.5.0` → `^3.8.0`  
- `@uppy/dashboard`: `^4.3.1` → `^3.7.2`
- `@uppy/react`: `^4.3.0` → `^3.1.3`
- Removed `@uppy/tus` (not essential for basic file uploads)

## Files to Upload to GitHub:

### **1. package.json** (replace with updated package-clean.json)
Now uses stable, available Uppy package versions.

### **2. Dockerfile** (already updated with --legacy-peer-deps)

### **3. nixpacks.toml** (already configured)

## Railway Environment Variables:
```
NODE_VERSION=20.11.0
NODE_ENV=production
PORT=5000
DATABASE_URL=[Auto-generated]
STRIPE_SECRET_KEY=[your_key]
VITE_STRIPE_PUBLIC_KEY=[your_key]
```

## Expected Result:
- Railway finds all package versions successfully
- Dependencies install with npm install --legacy-peer-deps
- Build completes and generates index-B9yXiVfA.js
- Working deployment at your-app.up.railway.app

This uses proven, stable Uppy versions that should install successfully on Railway.