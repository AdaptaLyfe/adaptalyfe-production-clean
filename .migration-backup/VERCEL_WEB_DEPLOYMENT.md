# Vercel Web Deployment Guide

## Setup Complete ✅

Your project is configured for Vercel deployment with:
- ✅ `vercel.json` - Deployment configuration
- ✅ `package-vercel.json` - Dependencies for Vercel
- ✅ Backend server ready with all latest fixes
- ✅ Sleep tracking database schema updated

## Deploy via Vercel Web Interface

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/
2. Sign up/login with GitHub account
3. Click "Add New" → "Project"

### Step 2: Import from GitHub
1. Connect your GitHub account
2. Import your repository
3. Select "Framework Preset": Other
4. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
In Vercel dashboard, add these environment variables:

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `NODE_ENV` - `production`

**Optional:**
- `SESSION_SECRET` - Random string for session security

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Get your backend URL (e.g., `https://your-project.vercel.app`)

## Alternative: Manual Upload

If you don't want to use GitHub:
1. Download your project as ZIP
2. Upload directly to Vercel
3. Follow same environment variable setup

## Expected Backend URL
After deployment: `https://adaptalyfe-backend-[random].vercel.app`

## Next Step: Connect Firebase Frontend
Once backend is deployed:
1. Update Firebase frontend to use Vercel backend URL
2. Configure CORS for cross-origin requests
3. Test sleep tracking with styled buttons

Your backend will include:
- ✅ All latest sleep tracking improvements
- ✅ Proper TIMESTAMP database schema
- ✅ Authentication system
- ✅ All API endpoints working