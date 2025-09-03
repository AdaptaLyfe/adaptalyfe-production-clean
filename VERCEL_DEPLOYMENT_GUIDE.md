# Vercel Backend Deployment Guide

## Ready to Deploy

Your project is configured for Vercel deployment with:
- ✅ vercel.json configuration file created
- ✅ Backend server ready with all latest fixes
- ✅ Sleep tracking with proper database schema
- ✅ All environment variables identified

## Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Deploy to Vercel
```bash
vercel
```

When prompted:
- Set up and deploy: **Yes**
- Link to existing project: **No** (create new)
- Project name: **adaptalyfe-backend** (or your preference)
- Directory: **.** (current directory)

## Step 4: Set Environment Variables

After deployment, add these environment variables in Vercel dashboard:

**Required Variables:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe public key (if needed for server)

**Optional Variables:**
- `NODE_ENV` - production
- `SESSION_SECRET` - random string for session security

## Step 5: Get Your Backend URL

After deployment, Vercel will provide a URL like:
`https://adaptalyfe-backend-username.vercel.app`

## Step 6: Update Firebase Frontend

Update your Firebase app to use the Vercel backend:
1. Configure API calls to point to Vercel URL
2. Update CORS settings if needed
3. Test the connection

## Expected Result

After completing these steps:
- ✅ Backend deployed to Vercel with database connection
- ✅ Firebase frontend connected to Vercel backend
- ✅ Sleep tracking fully functional with styled buttons
- ✅ All authentication and features working

Your Firebase frontend + Vercel backend architecture will provide the full Adaptalyfe experience with all recent improvements!