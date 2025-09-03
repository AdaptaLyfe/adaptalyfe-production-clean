# Railway Configuration Guide for Adaptalyfe

## Required Environment Variables

Add these in Railway's Variables section:

### 1. Database Configuration
```
DATABASE_URL = (Railway will provide this automatically if you add PostgreSQL)
```

### 2. Payment Processing (Critical for your app)
```
STRIPE_SECRET_KEY = (your Stripe secret key - starts with sk_)
VITE_STRIPE_PUBLIC_KEY = (your Stripe publishable key - starts with pk_)
```

### 3. Production Settings
```
NODE_ENV = production
PORT = ${{ PORT }} 
```

### 4. Optional API Keys (if you use them)
```
OPENAI_API_KEY = (for your AdaptAI chatbot feature)
SESSION_SECRET = (generate a random string for security)
```

## Custom Domain Setup

### In Railway Dashboard:
1. Go to your app → Settings → Domains
2. Click "Add Domain" 
3. Enter your custom domain (e.g., `app.adaptalyfeapp.com`)
4. Railway provides DNS instructions

### In Your Domain Provider:
1. Add CNAME record: `app` → `your-app.railway.app`
2. Or A record pointing to Railway's IP
3. Wait for DNS propagation (5-30 minutes)

## Database Setup

### Option 1: Use Railway PostgreSQL (Recommended)
1. In Railway → Add Service → PostgreSQL
2. Railway auto-connects it to your app
3. DATABASE_URL is automatically set

### Option 2: Use Existing Database
1. Add your current DATABASE_URL to environment variables
2. Ensure database allows Railway's IP connections

## CORS Configuration Update

Your app needs to allow your custom domain. Update this in your backend:

```javascript
// In server configuration
app.use(cors({
  origin: [
    'https://your-custom-domain.com',
    'https://your-app.railway.app'
  ],
  credentials: true
}));
```

## Testing Checklist

After setup, test these features:
- [ ] Landing page loads correctly
- [ ] User registration/login works
- [ ] Stripe payment system functions
- [ ] Sleep tracking saves data
- [ ] Dashboard loads with all modules
- [ ] Database connections work
- [ ] Custom domain resolves correctly

## Your App Features Status

All features should work immediately:
✅ Sleep tracking with blue/green styled buttons
✅ Landing page with cyan-teal-blue gradient
✅ Dashboard with drag-and-drop functionality
✅ Stripe payment system (Basic/Premium/Family tiers)
✅ Authentication and user management
✅ All premium features and caregiver system

## Production Optimization

Railway handles:
- Automatic HTTPS for custom domains
- Load balancing and scaling
- Real-time deployment logs
- Health checks and monitoring

Your app is now deployed on a much more reliable platform than Render!