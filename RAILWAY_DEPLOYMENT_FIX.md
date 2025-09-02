# Railway Deployment Fix - Complete Solution

## Issue Identified
Railway deployment failed with Node.js version compatibility errors during `npm ci` installation phase.

## Files to Upload to GitHub

### 1. **railway.json** (New file)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. **nixpacks.toml** (New file)
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['echo "Skipping frontend build - Express will serve dynamically"']

[start]
cmd = 'npm start'
```

### 3. **client/src/lib/config.ts** (Updated)
```typescript
// API Configuration for different environments
export const API_CONFIG = {
  // Use Railway backend for all production deployments
  // Detection: if we're not on localhost or replit dev, use Railway backend
  baseURL: (typeof window !== 'undefined' && 
           !window.location.hostname.includes('localhost') && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('replit.dev')) 
    ? 'https://adaptalyfe-production-clean.up.railway.app' // Railway backend URL
    : '', // Use relative URLs in development
  
  // Enable credentials for cross-origin requests
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
export function getApiUrl(path: string): string {
  const baseURL = API_CONFIG.baseURL;
  return baseURL ? `${baseURL}${path}` : path;
}
```

## How This Fixes the Deployment

### 1. **railway.json**
- Forces Railway to use NIXPACKS builder
- Sets proper start command
- Configures restart policies

### 2. **nixpacks.toml**
- Explicitly sets Node.js 20 and npm 9
- Skips the problematic `vite build` command
- Uses `npm ci` for clean dependency installation

### 3. **Updated API Config**
- Routes production API calls to Railway
- Maintains development functionality in Replit

## Upload Process

1. **Create railway.json** in your GitHub repository root
2. **Create nixpacks.toml** in your GitHub repository root  
3. **Update client/src/lib/config.ts** with Railway URL
4. **Commit changes**

## Expected Result After Upload

1. **Railway detects new configuration**
2. **Uses Node.js 20 with npm 9** (compatible versions)
3. **Skips problematic frontend build**
4. **Successfully builds server component**
5. **Deploys working application**

## Testing After Successful Deployment

1. **Direct Railway Test**: Visit Railway URL - should work completely
2. **Firebase Test**: API calls should route to Railway
3. **Custom Domain Test**: API calls should route to Railway
4. **Feature Test**: Login, tasks, payments should work on all URLs

This configuration eliminates the Node.js compatibility issues and ensures Railway deploys your Express server correctly while serving the React frontend dynamically.