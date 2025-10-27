# Custom Domain History: app.adaptalyfeapp.com

## 🌐 Domain Overview

**Custom Domain:** `https://app.adaptalyfeapp.com/`  
**Status:** ✅ Active and Live  
**Hosting Provider:** Firebase Hosting  
**Backend:** Replit (current) or Railway (previously planned)

---

## 📜 Historical Timeline

### Phase 1: Railway Deployment Plans (Past)

Based on the documentation in the codebase, there was a **planned migration to Railway** hosting:

**Evidence Found:**
- `RAILWAY_SETUP_GUIDE.md` - Complete Railway deployment guide
- `RAILWAY_CORS_UPDATED.md` - CORS configuration for Railway
- `RAILWAY_LOGIN_FIX.md` - Authentication fixes for Railway
- `RAILWAY_FINAL_FIX.md` - Railway deployment troubleshooting
- `server/production.ts` line 60 - CORS includes `'https://app.adaptalyfeapp.com'`

**Purpose:**
The Railway deployment was intended as an alternative to Replit for:
- More reliable backend hosting
- Custom domain support
- Better production environment
- Solving Vite caching issues experienced on Render

**Configuration:**
```javascript
// server/production.ts
const allowedOrigins = [
  'https://adaptalyfe-5a1d3.web.app',           // Firebase
  'https://adaptalyfe-db-production.up.railway.app', // Railway backend
  'https://app.adaptalyfeapp.com'               // Custom domain
];
```

### Phase 2: Firebase Custom Domain Setup (Current)

**Current Configuration:**
- **Frontend:** Firebase Hosting with custom domain `app.adaptalyfeapp.com`
- **Backend:** Replit API server

**How It Works:**
1. Domain `app.adaptalyfeapp.com` points to Firebase Hosting
2. Firebase serves the static React app
3. React app makes API calls to Replit backend
4. CORS allows cross-origin requests

---

## 🔧 Current Architecture

```
User Request
    ↓
https://app.adaptalyfeapp.com/
    ↓
[Firebase Hosting + Custom Domain]
    ├── Serves: Static React App (HTML/JS/CSS)
    ├── Content: dist/public/ build artifacts
    └── CDN: Global content delivery
    
    ↓ API Requests
    
[Replit Backend]
    ├── API: https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev
    ├── Database: PostgreSQL (Neon)
    └── Authentication: Session + Token-based
```

---

## 📋 Domain Configuration Details

### DNS Settings

The custom domain `app.adaptalyfeapp.com` is configured with:

**Type:** CNAME or A Record  
**Points to:** Firebase Hosting servers  
**SSL/TLS:** Automatic HTTPS via Firebase  

### Firebase Hosting Setup

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist/public",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Custom Domain Added:**
- Firebase Console → Hosting → Custom Domains
- Domain verified and connected
- SSL certificate provisioned automatically

---

## 🔍 Domain Verification (Current Status)

**HTTP Headers Analysis:**
```
HTTP/2 200 
cache-control: max-age=3600
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31556926
x-served-by: cache-bfi-kbfi7400060-BFI
```

**Key Indicators:**
✅ Served by Firebase CDN (cache headers present)  
✅ HTTPS enabled (HSTS header)  
✅ Content served from Firebase Hosting  
✅ Same content as `adaptalyfe-5a1d3.web.app`

---

## 🎯 Current Domain Usage

### Production URLs

**Primary Custom Domain:**
- `https://app.adaptalyfeapp.com/` → Firebase Hosting

**Firebase Default Domains:**
- `https://adaptalyfe-5a1d3.web.app/` → Firebase Hosting
- `https://adaptalyfe-5a1d3.firebaseapp.com/` → Firebase Hosting

**Backend API:**
- `https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev` → Replit

### All domains serve the SAME frontend app!

---

## 📝 Code References to Custom Domain

### 1. server/production.ts (Line 60)
```javascript
const allowedOrigins = [
  'http://localhost:5000', 
  'http://127.0.0.1:5000',
  'https://adaptalyfe-5a1d3.web.app',
  'https://adaptalyfe-5a1d3.firebaseapp.com',
  'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
  'https://adaptalyfe-db-production.up.railway.app',
  'https://app.adaptalyfeapp.com'  // ← Custom domain in CORS
];
```

**Purpose:** Allows API requests from custom domain

### 2. expo-qr-code.html (Line 157)
```html
API Connected to: <strong>app.adaptalyfeapp.com</strong>
```

**Purpose:** Documentation for mobile app QR code testing

### 3. Documentation Files
- `RAILWAY_SETUP_GUIDE.md` - Custom domain setup instructions
- `RAILWAY_CORS_UPDATED.md` - CORS configuration for custom domain
- `EXACT_SCREENSHOT_FIX.md` - References to www.adaptalyfeapp.com
- `NEXT_STEPS_APP_STORE_SUBMISSION.md` - App Store URLs

---

## 🚀 Deployment Process

### Frontend Deployment to Custom Domain

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Result:**
   - Available at: `https://app.adaptalyfeapp.com/`
   - Available at: `https://adaptalyfe-5a1d3.web.app/`
   - Same deployment, multiple URLs

### Backend Connection

**No changes needed** - Backend API URL is hardcoded in:
```typescript
// client/src/lib/queryClient.ts
const API_CONFIG = {
  baseURL: 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
};
```

All frontends (custom domain, Firebase defaults, mobile apps) connect to the same Replit backend!

---

## 🔐 CORS Configuration

### Current CORS Setup (server/production.ts)

```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Mobile apps
    
    const allowedOrigins = [
      'https://adaptalyfe-5a1d3.web.app',
      'https://app.adaptalyfeapp.com',  // Custom domain
      // ... other origins
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(null, true); // Currently allowing all
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

**Status:** ✅ Custom domain allowed for API access

---

## 🎨 Website/Domain Relationship

### Domain Ownership

**Base Domain:** `adaptalyfeapp.com`  
**Subdomain in Use:** `app.adaptalyfeapp.com`  
**Other Subdomains Referenced:** `www.adaptalyfeapp.com` (in documentation)

### Potential Domain Structure

```
adaptalyfeapp.com (root domain)
├── www.adaptalyfeapp.com     → Marketing site (potential)
├── app.adaptalyfeapp.com     → Web application (current)
├── api.adaptalyfeapp.com     → Backend API (potential)
└── docs.adaptalyfeapp.com    → Documentation (potential)
```

**Currently Used:**
- `app.adaptalyfeapp.com` → Firebase-hosted React app ✅

---

## 📊 Comparison: Default vs Custom Domain

| Feature | adaptalyfe-5a1d3.web.app | app.adaptalyfeapp.com |
|---------|--------------------------|------------------------|
| **Hosting** | Firebase | Firebase |
| **Content** | Same React app | Same React app |
| **SSL/HTTPS** | ✅ Automatic | ✅ Automatic |
| **CDN** | ✅ Global | ✅ Global |
| **Backend API** | Replit | Replit |
| **Branding** | Firebase subdomain | Custom domain ✅ |
| **Professional** | Less professional | More professional ✅ |
| **Cost** | Free | Free (just domain registration) |
| **Setup** | Automatic | Requires DNS configuration |

**Recommendation:** Use `app.adaptalyfeapp.com` for production/professional use ✅

---

## 🔄 Railway Migration Status

**Status:** ❌ Not Completed (Planned but not executed)

**Evidence:**
- Railway documentation exists in codebase
- CORS configuration prepared for Railway URLs
- References to `adaptalyfe-db-production.up.railway.app`

**Current Reality:**
- Backend still on Replit
- Railway deployment guides are historical/preparatory documentation
- Custom domain points to Firebase, not Railway

**Why Railway Was Considered:**
1. More reliable than Render (previous host)
2. Better production environment
3. Custom domain support
4. Solved Vite caching issues

**Why Still on Replit:**
- Working solution in place
- No urgent need to migrate
- Replit provides sufficient reliability

---

## ✅ Summary

### What IS Connected to app.adaptalyfeapp.com:
✅ **Firebase Hosting** - Serves the React frontend  
✅ **Static Web App** - Built from `dist/public/`  
✅ **Same content** as adaptalyfe-5a1d3.web.app  
✅ **HTTPS/SSL** - Automatic via Firebase  
✅ **Global CDN** - Fast worldwide delivery

### What IS NOT Connected:
❌ **NOT a separate backend** - Uses Replit backend like other frontends  
❌ **NOT hosted on Railway** - Despite documentation references  
❌ **NOT a different app** - Exact same deployment as Firebase defaults

### The Full Stack:
```
Frontend: app.adaptalyfeapp.com (Firebase)
    ↓
Backend: Replit API
    ↓
Database: PostgreSQL (Neon via Replit)
```

**Latest Code Status:** ✅ Fully compatible with custom domain  
**CORS Configuration:** ✅ Includes app.adaptalyfeapp.com  
**Authentication:** ✅ Works with token-based + cookie-based auth  
**Mobile Apps:** ✅ Use same backend, different frontend bundle

---

## 🚀 Next Steps (If Needed)

### To Update Custom Domain Deployment:
1. Make frontend changes
2. `npm run build`
3. `firebase deploy --only hosting`
4. Changes live at both:
   - `https://app.adaptalyfeapp.com/`
   - `https://adaptalyfe-5a1d3.web.app/`

### To Actually Use Railway (If Desired):
1. Deploy backend to Railway
2. Update `client/src/lib/queryClient.ts` with Railway API URL
3. Configure Railway environment variables
4. Update CORS origins in `server/production.ts`
5. Deploy backend to Railway
6. Update Firebase frontend to point to Railway API

**Current Recommendation:** Keep using Replit backend - it's working well! ✅

---

**Document Created:** October 27, 2025  
**Domain Status:** Active and Working  
**Backend:** Replit (not Railway)  
**Frontend:** Firebase with Custom Domain
