# Package.json Conflict Resolution Instructions

## Conflicts Found in package.json:

### 1. Line 9-11: Duplicate build scripts
```json
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server-dist",

"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
```
**FIX**: Keep only the "dist" version (line 11), delete line 9

### 2. Lines 23-29: @google-cloud/storage conflict
```json
<<<<<<< HEAD
"@google-cloud/storage": "^7.17.0",
=======

"@google-cloud/storage": "^7.17.0",
 
>>>>>>> 2099839fe8e01ffb28543c574633d71fb0541898
```
**FIX**: Replace all this with just: `"@google-cloud/storage": "^7.17.0",`

## Manual Steps Required:

1. **Open package.json in Replit editor**
2. **Find line 9** and delete: `"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server-dist",`
3. **Find lines 23-29** and replace with: `"@google-cloud/storage": "^7.17.0",`
4. **Remove all conflict markers**: `<<<<<<< HEAD`, `=======`, `>>>>>>> commit-hash`
5. **Save the file**

## After Manual Fix:
- Git panel will show "All conflicts resolved"
- "Complete Merge" button will become available
- Click it to finalize merge
- All 1019+ commits will push to GitHub
- Ready for Vercel deployment

## Expected Result:
Clean package.json with:
- Single build script pointing to "dist"
- Clean dependencies section
- No conflict markers