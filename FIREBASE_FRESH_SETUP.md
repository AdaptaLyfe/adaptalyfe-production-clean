# Complete Firebase Setup Guide

## Step 1: Prepare Your Code for Deployment

Your Replit project is ready for deployment. All recent changes include:
- ✅ Sleep tracking with proper TIMESTAMP database schema
- ✅ Styled button boxes (blue for Log Sleep, green for Save)
- ✅ Complete authentication system
- ✅ All features working in Replit preview

## Step 2: Firebase Project Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Create a new project** (or delete/recreate existing one)
3. **Enable Firebase Hosting**
4. **Set up database connection**:
   - Use your existing PostgreSQL database URL
   - Or create a new database instance

## Step 3: Install Firebase CLI & Deploy

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Build your project
npm run build

# Deploy to Firebase
firebase deploy
```

## Step 4: Environment Variables Setup

In Firebase hosting, configure these environment variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe public key

## Step 5: Database Schema Deployment

Since this is a fresh setup, the database will automatically create tables with the correct schema:
- Sleep sessions with proper TIMESTAMP columns
- All other tables with current structure
- No migration conflicts

## Step 6: Test Deployment

After deployment:
1. Visit your Firebase URL
2. Login with admin/demo2025
3. Test sleep tracking functionality
4. Verify button styling and data saving

## Why Fresh Setup Fixes Everything

- ✅ No old schema conflicts
- ✅ Clean database structure
- ✅ Latest code with all fixes
- ✅ Proper environment configuration
- ✅ All styled components included

This approach eliminates any schema mismatch issues and ensures your Firebase deployment matches exactly what's working in Replit.