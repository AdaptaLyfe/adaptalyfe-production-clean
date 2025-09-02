# Firebase Functions Deployment Guide

Your Firebase Functions backend is now ready for deployment! Here's how to deploy without permission issues.

## Quick Start (Recommended)

### 1. Login to Firebase
```bash
./firebase-login.sh
```

### 2. Deploy Everything
```bash
./deploy-firebase.sh
```

## Manual Commands (If scripts don't work)

### Login
```bash
npx firebase-tools login
```

### Deploy Functions Only
```bash
npx firebase-tools deploy --only functions
```

### Deploy Hosting Only
```bash
npx firebase-tools deploy --only hosting
```

### Deploy Database Rules
```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

### Deploy Everything
```bash
npx firebase-tools deploy
```

## Environment Variables Setup

Before deploying, set up your environment variables in Firebase:

```bash
npx firebase-tools functions:config:set \
  stripe.secret_key="sk_test_..." \
  stripe.webhook_secret="whsec_..." \
  openai.api_key="sk-..." \
  stripe.price_basic_monthly="price_..." \
  stripe.price_premium_monthly="price_..."
```

## Your App URLs After Deployment

- **Frontend**: https://adaptalyfe-app.web.app
- **API**: https://us-central1-adaptalyfe-app.cloudfunctions.net/api
- **Firebase Console**: https://console.firebase.google.com/project/adaptalyfe-app

## Troubleshooting

### Permission Denied Error
- Use `npx firebase-tools` instead of `firebase`
- Run `./firebase-login.sh` first

### Functions Build Error
- Check `functions/` directory has all dependencies: `cd functions && npm install`
- Verify TypeScript compiles: `cd functions && npm run build`

### Hosting Build Error
- Run `npm run build` in root directory first
- Check `client/dist/` folder exists

## Monitoring

### View Function Logs
```bash
npx firebase-tools functions:log
```

### View Hosting Status
```bash
npx firebase-tools hosting:channel:list
```

### Test Functions Locally
```bash
npx firebase-tools emulators:start
```

Your Firebase Functions setup includes:
- ✅ Authentication with Firebase ID tokens
- ✅ Daily tasks management
- ✅ Mood tracking
- ✅ Medical appointments & medications
- ✅ Financial management & bills
- ✅ Stripe subscription system
- ✅ Firestore security rules
- ✅ Database indexes for performance