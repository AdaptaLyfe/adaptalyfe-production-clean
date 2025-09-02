# 📍 Where to Update Build Commands in Render

## You're Looking at Build Filters (Wrong Section)
The screenshot shows "Build Filters" which controls when deployments trigger, not the actual build commands.

## ✅ Find the Right Section

### **Step 1: Navigate to Build Commands**
1. **Scroll up** in your service settings
2. Look for section called **"Build & Deploy"** or **"Build Command"**
3. It should be near the top of the settings page

### **Step 2: What to Look For**
You need to find these fields:
- **Build Command** (currently shows: `npm ci && npm run build`)
- **Start Command** (currently shows: `npm start`)

### **Step 3: Update Build Command**
Change the **Build Command** from:
```
npm ci && npm run build
```

To:
```
npm ci && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

Keep **Start Command** as:
```
npm start
```

## **Alternative: Check Environment Tab**
If you can't find Build & Deploy section:
1. Click **"Settings"** tab (main settings)
2. Look for **"Build Command"** field
3. Or try the **"Environment"** tab for build settings

## **Visual Guide**
The correct section should show:
- Title: "Build & Deploy" or similar
- Two text input fields for commands
- Not the "Build Filters" section you're currently viewing

## **After Making Changes**
1. **Save** the settings
2. **Manual Deploy** to trigger rebuild
3. Watch build logs for success

The build should complete without the Vite error once you update the correct Build Command field.