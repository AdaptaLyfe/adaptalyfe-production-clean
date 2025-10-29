# 🔄 GitHub Sync Guide

## ✅ GitHub Connection Status
**CONNECTED!** Your GitHub account is linked to this Replit project.

**Repository:** https://github.com/Adaptalyfe/adaptalyfe-production-clean

---

## 🚀 Quick Sync (Automatic)

Run this command to sync your latest code to GitHub:

```bash
node sync-to-github.js
```

**What it does:**
- ✅ Authenticates with your GitHub account (via Replit integration)
- ✅ Pushes latest changes to your repository
- ✅ Creates a commit with timestamp
- ✅ Syncs all important files

**Files that will be synced:**
- `client/src/lib/queryClient.ts` (Session persistence)
- `client/src/App.tsx` (Auto-login)
- `client/src/components/simple-navigation.tsx` (Logout button)
- `server/index.ts` (Backend)
- `server/routes.ts` (API routes)
- `package.json` (Dependencies)
- Documentation files (README, replit.md, etc.)

---

## 📝 Manual Sync (Alternative)

If you prefer using git commands manually, you can use the Replit Shell:

### Step 1: Stage Changes
```bash
git add .
```

### Step 2: Commit Changes
```bash
git commit -m "Session persistence + Logout button + Syntax fixes"
```

### Step 3: Push to GitHub
```bash
git push origin main
```

**Note:** Replit has some restrictions on git commands for safety. If manual git doesn't work, use the automatic sync script above.

---

## 🎯 What's New in This Sync

### Session Persistence ✅
- Users stay logged in when app closes/reopens
- Token stored in localStorage with verification
- Auto-navigation to dashboard on startup

### Logout Button ✅
- Red button at bottom of navigation menu
- Clears session token
- Navigates to login page

### Syntax Error Fix ✅
- Cleared Vite cache
- Clean frontend rebuild
- Server restart with fresh configuration

---

## 📦 Files Synced

### Frontend Changes:
1. **`client/src/lib/queryClient.ts`**
   - Enhanced session token storage
   - Safe localStorage with verification
   - Improved logout function

2. **`client/src/App.tsx`**
   - Session restoration on startup
   - Auto-navigate to dashboard

3. **`client/src/components/simple-navigation.tsx`**
   - Added logout button

### Documentation:
- `SESSION_PERSISTENCE_CHANGES.md` - Technical details
- `SYNTAX_ERROR_FIX.md` - Troubleshooting guide
- `GITHUB_SYNC_GUIDE.md` - This file!

---

## 🔍 Verify Sync

After syncing, check your GitHub repository:

1. Go to https://github.com/Adaptalyfe/adaptalyfe-production-clean
2. Look for latest commit with timestamp
3. Verify files are updated

---

## ⚙️ Configuration

**Current Settings:**
- **Repository Owner:** Adaptalyfe
- **Repository Name:** adaptalyfe-production-clean
- **Branch:** main
- **Authentication:** GitHub OAuth (via Replit)

**To change repository:**
Edit `sync-to-github.js` and update:
```javascript
const REPO_OWNER = 'YourUsername';
const REPO_NAME = 'your-repo-name';
const BRANCH = 'main'; // or 'master'
```

---

## 🛠️ Troubleshooting

### "GitHub not connected" Error
**Fix:** Reconnect GitHub in Replit integrations panel

### "Permission denied" Error
**Fix:** Check repository permissions (need write access)

### "Rate limit exceeded" Error
**Fix:** Wait 1 hour, GitHub API has limits

### Manual Git Blocked
**Fix:** Use the automatic sync script (`node sync-to-github.js`)

---

## 📚 Next Steps

After syncing to GitHub, you can:
1. ✅ Deploy to GitHub Pages
2. ✅ Set up GitHub Actions for CI/CD
3. ✅ Share repository with collaborators
4. ✅ Create releases and tags
5. ✅ Track issues and pull requests

---

**Quick Command:** `node sync-to-github.js`

**Repository:** https://github.com/Adaptalyfe/adaptalyfe-production-clean

🎉 **Your code is ready to sync!**
