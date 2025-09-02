# 🔐 Render Environment Variables Setup

## Required Environment Variables
Add these to your Render service to connect frontend and backend:

### 1. Database Connection
```
DATABASE_URL=your_postgresql_connection_string
PGDATABASE=your_database_name
PGHOST=your_host
PGPASSWORD=your_password
PGPORT=5432
PGUSER=your_username
```

### 2. Stripe Payment System
```
STRIPE_SECRET_KEY=sk_live_or_test_key
VITE_STRIPE_PUBLIC_KEY=pk_live_or_test_key
```

### 3. Application Settings
```
NODE_ENV=production
PORT=8080
```

## How to Add in Render Dashboard

### Step 1: Access Environment Variables
1. Go to your Render service dashboard
2. Click on your web service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**

### Step 2: Add Each Variable
For each variable above:
1. **Key**: Enter the variable name (e.g., `DATABASE_URL`)
2. **Value**: Enter the corresponding value
3. Click **"Add"**

### Step 3: Deploy Changes
1. After adding all variables, click **"Save Changes"**
2. Render will automatically redeploy your service
3. The medical app will now have full connectivity

## What This Enables
- **Database connectivity**: User data persistence, medical records
- **Stripe payments**: Subscription system ($4.99, $12.99, $24.99 tiers)
- **Frontend-backend communication**: API calls work properly
- **Authentication**: User login and secure sessions
- **Medical features**: All task management, mood tracking, medication reminders

## Verification After Setup
- Health check: `https://[your-service].onrender.com/health`
- Database connection confirmed in logs
- Payment system functional
- Medical app features fully operational

Your comprehensive medical application will be fully integrated and functional.