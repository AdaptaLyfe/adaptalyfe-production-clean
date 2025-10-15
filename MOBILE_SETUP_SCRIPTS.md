# Mobile Build Scripts

Add these scripts to your `package.json` under the `"scripts"` section for easy mobile development:

```json
"mobile:build": "npm run build && npx cap sync",
"mobile:sync": "npx cap sync",
"mobile:ios": "npm run build && npx cap sync ios && npx cap open ios",
"mobile:android": "npm run build && npx cap sync android && npx cap open android",
"mobile:sync:ios": "npx cap sync ios",
"mobile:sync:android": "npx cap sync android",
"mobile:open:ios": "npx cap open ios",
"mobile:open:android": "npx cap open android"
```

## Usage

### Build and open iOS app (requires Mac):
```bash
npm run mobile:ios
```

### Build and open Android app:
```bash
npm run mobile:android
```

### Just sync web assets to mobile without opening:
```bash
npm run mobile:sync
```

### Sync to specific platform:
```bash
npm run mobile:sync:ios     # iOS only
npm run mobile:sync:android # Android only
```

### Open in native IDE without building:
```bash
npm run mobile:open:ios     # Open Xcode
npm run mobile:open:android # Open Android Studio
```

## Development Workflow

1. **Make changes to your web app** (in `client/` directory)
2. **Build for production:** `npm run build`
3. **Sync to mobile:** `npx cap sync`
4. **Open in IDE:** `npx cap open ios` or `npx cap open android`
5. **Run on device/simulator** from Xcode or Android Studio
