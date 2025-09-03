# Firebase Connection Fix - Environment Detection

## Issue Identified
The problem was environment detection. Firebase wasn't being recognized as "production" so API calls were going to relative URLs instead of the Replit backend.

## Fix Applied
Updated `client/src/lib/config.ts` to use hostname detection instead of `import.meta.env.PROD`:

```javascript
// Before: import.meta.env.PROD (unreliable)
// After: window.location.hostname detection (reliable)

baseURL: (typeof window !== 'undefined' && 
         !window.location.hostname.includes('localhost') && 
         !window.location.hostname.includes('127.0.0.1')) 
  ? 'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev'
  : ''
```

## How It Works Now
- **Development (localhost)**: Uses relative URLs → Replit server
- **Firebase (adaptalyfe-5a1d3.web.app)**: Uses Replit backend URL
- **Runtime Detection**: Checks hostname when app loads

## Deployment Status
- ✅ Updated JavaScript bundle built
- ✅ Hostname detection code embedded (verified)
- ✅ Ready for Firebase deployment

## Expected Result
When you visit Firebase URL:
1. App detects it's NOT localhost
2. Automatically routes API calls to Replit backend
3. Authentication and all features work properly
4. Sleep tracking with styled buttons functional

This should resolve the login/navigation issues you were experiencing.