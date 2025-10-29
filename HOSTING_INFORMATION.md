# Adaptalyfe Hosting Information

## 📍 Live Deployment URL
**https://adaptalyfe-5a1d3.web.app/**

---

## 🌐 Frontend Hosting

### Provider: **Google Firebase Hosting**

**Live URL:** https://adaptalyfe-5a1d3.web.app/

### Firebase Project Details
- **Project ID:** `adaptalyfe-app` (from `.firebaserc`)
- **Firebase Project Name:** `adaptalyfe-5a1d3`
- **Hosting Type:** Static web hosting with global CDN
- **Default Domains:**
  - Primary: `adaptalyfe-5a1d3.web.app`
  - Alternative: `adaptalyfe-5a1d3.firebaseapp.com` (Firebase auto-provides both)

### What's Hosted
- **Build Artifacts:** Static files from `dist/public/` directory
- **Content:** HTML, CSS, JavaScript (React SPA)
- **Configuration:** `firebase.json` defines hosting rules

### Firebase Hosting Features
✅ **Global CDN** - Fast content delivery worldwide  
✅ **Automatic HTTPS** - SSL certificate included  
✅ **SPA Routing** - All routes redirect to `/index.html`  
✅ **Cache Control** - Optimized for static assets  
✅ **Free Tier** - 10 GB storage, 360 MB/day bandwidth

### Deployment Configuration

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist/public",
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### How to Deploy Frontend

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Result:**
   - Frontend deployed to: `https://adaptalyfe-5a1d3.web.app/`
   - Changes live within seconds

---

## 🔧 Backend Hosting

### Provider: **Replit**

**Backend API URL:** https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev

### Replit Backend Details
- **Platform:** Replit Cloud
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL (Neon-backed, built-in Replit database)
- **Session Storage:** In-memory session store (MemoryStore)
- **Environment:** Always-on deployment

### What's Hosted
- **API Server:** Express.js REST API
- **Database:** PostgreSQL for data persistence
- **Authentication:** Session-based + token-based (for mobile)
- **Endpoints:** `/api/*` routes for all backend operations

### Key Backend Features
✅ **RESTful API** - All business logic and data operations  
✅ **PostgreSQL Database** - User data, tasks, finances, etc.  
✅ **CORS Enabled** - Allows Firebase frontend to connect  
✅ **Session Management** - Cookie-based + Authorization header  
✅ **Stripe Integration** - Payment processing  
✅ **OpenAI Integration** - AdaptAI chatbot

### Backend Configuration

**API Connection (from `client/src/lib/queryClient.ts`):**
```typescript
const API_CONFIG = {
  // Firebase deployment always uses Replit backend
  baseURL: 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
  credentials: 'include', // Send cookies cross-origin
};
```

### Environment Variables (Backend)
```bash
DATABASE_URL=<Neon PostgreSQL connection string>
STRIPE_SECRET_KEY=<Stripe API key>
VITE_STRIPE_PUBLIC_KEY=<Stripe public key>
OPENAI_API_KEY=<OpenAI API key>
SESSION_SECRET=<Session encryption key>
```

---

## 🔄 Architecture: Frontend ↔ Backend Connection

```
┌─────────────────────────────────────────┐
│  Firebase Hosting (Frontend)            │
│  https://adaptalyfe-5a1d3.web.app/     │
│                                          │
│  - Static React SPA                     │
│  - Client-side routing (Wouter)        │
│  - TanStack Query for API calls        │
└────────────┬────────────────────────────┘
             │
             │ API Requests
             │ (Authorization: Bearer {token})
             │
             ▼
┌─────────────────────────────────────────┐
│  Replit Backend (API Server)            │
│  https://f0feebb6-...-00-tpbq...dev    │
│                                          │
│  - Express.js REST API                  │
│  - PostgreSQL Database (Neon)          │
│  - Session + Token Authentication      │
│  - Stripe, OpenAI integrations         │
└─────────────────────────────────────────┘
```

### Request Flow
1. User visits `https://adaptalyfe-5a1d3.web.app/`
2. Firebase serves static HTML/JS/CSS
3. React app loads in browser
4. User logs in → API call to Replit backend
5. Backend returns `sessionToken`
6. Frontend saves token to `localStorage`
7. All subsequent API calls include: `Authorization: Bearer {token}`
8. Backend validates token and returns data

---

## 📱 Mobile App Architecture

### Android/iOS Apps (Capacitor)
- **WebView Container:** Capacitor bundles the frontend locally
- **Web Assets:** Stored in `android/app/src/main/assets/public/`
- **Backend Connection:** Same Replit API URL
- **Authentication:** Token-based (Authorization header)

```
┌─────────────────────────────────────────┐
│  Mobile App (Capacitor WebView)        │
│  - Local frontend assets (offline)     │
│  - App ID: com.adaptalyfe.app          │
└────────────┬────────────────────────────┘
             │
             │ API Requests
             │ (Authorization: Bearer {token})
             │
             ▼
┌─────────────────────────────────────────┐
│  Replit Backend (Same API)              │
│  https://f0feebb6-...-00-tpbq...dev    │
└─────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### Web (Firebase Deployment)
- **Method:** Cookie-based sessions (httpOnly cookies)
- **Flow:** Login → Backend sets session cookie → Browser sends cookie automatically

### Mobile (Capacitor Apps)
- **Method:** Token-based authentication
- **Flow:** Login → Backend returns `sessionToken` → App stores in localStorage → Sent as `Authorization: Bearer {token}` header
- **Reason:** Mobile WebViews don't reliably save/send cookies

### Backend Support (Both Methods)
```typescript
// Global middleware checks BOTH cookie AND Authorization header
app.use(async (req, res, next) => {
  // Check Authorization header first (mobile)
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7);
    // Load session from token
    sessionStore.get(sessionToken, (err, sessionData) => {
      if (sessionData) {
        req.session.userId = sessionData.userId;
        req.session.user = sessionData.user;
      }
    });
  }
  // If no Authorization header, fall back to cookie session
  next();
});
```

---

## 💰 Costs

### Frontend (Firebase Hosting)
- **Current Plan:** Free tier (Spark Plan)
- **Free Limits:**
  - Storage: 10 GB
  - Bandwidth: 360 MB/day (~10.8 GB/month)
- **Estimated Usage:** Well within free tier
- **Cost:** **$0/month**

### Backend (Replit)
- **Current Plan:** Replit subscription
- **Database:** PostgreSQL included
- **Cost:** Varies by Replit plan

### Total Estimated Cost: **~$0-10/month**
(Depends on Replit subscription tier)

---

## 🚀 Deployment Commands

### Deploy Frontend Only
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Backend (Replit)
- **Auto-deploys** when you push changes to Replit
- Workflow `Start application` runs automatically

### Full Deployment (Both)
1. **Backend:** Push changes to Replit → Auto-deploys
2. **Frontend:** `npm run build && firebase deploy --only hosting`

---

## 🔧 Maintenance

### Update Frontend
1. Make changes to `client/` files
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy: `firebase deploy --only hosting`
5. Verify: Visit `https://adaptalyfe-5a1d3.web.app/`

### Update Backend
1. Make changes to `server/` files
2. Replit auto-restarts workflow
3. Test API endpoints
4. Changes live immediately

### Update Mobile Apps
1. Make frontend changes
2. Build: `npm run build`
3. Sync: `npx cap sync android` / `npx cap sync ios`
4. Build APK/IPA
5. Submit to app stores

---

## 📊 Monitoring

### Frontend (Firebase)
- **Console:** https://console.firebase.google.com/project/adaptalyfe-app
- **Metrics:** Usage, hosting bandwidth, storage
- **Logs:** Firebase Hosting request logs

### Backend (Replit)
- **Console:** Replit workspace
- **Logs:** Workflow logs in Replit UI
- **Database:** PostgreSQL connection string in secrets

---

## 🔗 Custom Domain (Optional)

### Add Custom Domain to Firebase
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter domain: `app.yourdomain.com`
4. Verify ownership (add TXT record to DNS)
5. Connect domain (add A/CNAME records)
6. Wait for SSL provisioning (5 min - 24 hours)

**Result:** `https://app.yourdomain.com` → Firebase frontend → Replit backend

---

## 📝 Summary

| Component | Provider | URL | Cost |
|-----------|----------|-----|------|
| **Frontend** | Firebase Hosting | https://adaptalyfe-5a1d3.web.app/ | Free |
| **Backend** | Replit | https://f0feebb6-...-dev | Replit subscription |
| **Database** | Neon (via Replit) | PostgreSQL connection | Included |
| **Mobile Apps** | Local WebView | Capacitor bundles | N/A |

**Total Monthly Cost:** ~$0-10 (depends on Replit tier)

---

## 🎯 Next Steps

1. ✅ Frontend deployed on Firebase
2. ✅ Backend running on Replit  
3. ✅ Mobile apps build from this codebase
4. 🔲 (Optional) Add custom domain
5. 🔲 (Optional) Publish to App Store / Play Store

**Everything is live and working!** 🚀
