# Railway Fresh Setup - Environment Variables

## Required Environment Variables for New Railway Project

### **Database Variables** (Railway PostgreSQL)
```
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/railway
PGDATABASE=railway
PGHOST=[railway_host]
PGPASSWORD=[railway_password]
PGPORT=[railway_port]
PGUSER=postgres
```

### **Stripe Payment Variables**
```
STRIPE_SECRET_KEY=sk_test_[your_stripe_secret_key]
VITE_STRIPE_PUBLIC_KEY=pk_test_[your_stripe_public_key]
```

### **Node.js Settings**
```
NODE_VERSION=20.11.0
NODE_ENV=production
PORT=5000
```

## Railway Deployment Settings

### **Build Configuration**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node.js Version**: 20.11.0 (important!)

### **Port Configuration**
- **Internal Port**: 5000
- **Health Check**: `/api/health`

## Files Required in Repository

### **1. nixpacks.toml** (Railway build configuration)
```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.build]
cmds = ['npm ci', 'npm run build']

[start]
cmd = 'npm start'
```

### **2. package.json** (Start script)
```json
{
  "scripts": {
    "start": "NODE_ENV=production tsx server/index.ts"
  }
}
```

## Expected Result
- Railway builds with Node.js 20
- Generates `index-B9yXiVfA.js` with smart backend detection
- Backend API runs at `your-app.up.railway.app`
- Authentication works with demo_user/password123
- Smart frontend detection connects automatically

## Troubleshooting
If build fails:
1. Check Node.js version is set to 20.11.0
2. Verify all environment variables are set
3. Ensure nixpacks.toml is in repository root
4. Check Railway logs for specific errors

This should recreate the working Railway deployment from last night!