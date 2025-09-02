# Railway Final Fix - Force Node.js 20

## Problem
Railway keeps using Node.js 18.20.5 despite nixpacks.toml configuration.

## Solution: Multiple Node Version Enforcement Methods

### **1. Updated nixpacks.toml**
```toml
[variables]
NODE_VERSION = "20.11.0"

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --legacy-peer-deps"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### **2. .nvmrc File**
```
20.11.0
```

### **3. Dockerfile (Backup)**
```dockerfile
FROM node:20.11.0
# ... (already created)
```

## Railway Environment Variables
```
NODE_VERSION=20.11.0
NODE_ENV=production
PORT=5000
DATABASE_URL=[Railway auto-generates]
STRIPE_SECRET_KEY=[your_key]
VITE_STRIPE_PUBLIC_KEY=[your_key]
```

## Upload to GitHub:
1. **nixpacks.toml** (updated with variables first)
2. **.nvmrc** (new - forces Node version)
3. **Dockerfile** (existing backup)

## Expected Behavior:
Railway should detect Node.js 20 through:
1. .nvmrc file (standard Node version specification)
2. nixpacks.toml variables section
3. Dockerfile if others fail

This triple-enforcement approach should finally override Railway's default Node.js 18 and get the build working.