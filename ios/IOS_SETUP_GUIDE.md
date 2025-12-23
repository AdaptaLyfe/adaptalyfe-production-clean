# Adaptalyfe iOS App - Xcode Setup Guide

## Quick Start (5 Minutes)

### Prerequisites
- macOS with Xcode 15+ installed
- CocoaPods installed (`sudo gem install cocoapods`)
- Apple Developer Account (for App Store publishing)

### Step 1: Install CocoaPods Dependencies
```bash
cd ios/App
pod install
```

### Step 2: Open in Xcode
```bash
open App.xcworkspace
```
**Important:** Always open `.xcworkspace`, NOT `.xcodeproj`

### Step 3: Configure Signing
1. Select "App" target in Xcode
2. Go to "Signing & Capabilities" tab
3. Select your Team
4. Xcode will automatically manage signing

### Step 4: Run on Simulator or Device
- Select a simulator (iPhone 15 Pro recommended)
- Press `Cmd + R` to build and run

---

## App Configuration

### Bundle ID
`com.adaptalyfe.app`

### App Name
`Adaptalyfe`

### Version
Update in Xcode target settings:
- MARKETING_VERSION (e.g., 1.0.0)
- CURRENT_PROJECT_VERSION (build number, e.g., 1)

---

## Server Configuration

The app connects to: `https://app.getadaptalyfeapp.com`

This is configured in `App/capacitor.config.json`

---

## Permissions Configured

The following permissions are already set in Info.plist:
- Camera (for task photos)
- Photo Library (for image attachments)
- Location (for geofencing/safety)
- Microphone (for voice commands)
- Calendar (for appointments)
- Reminders (for task reminders)
- Contacts (for support network)

---

## App Store Submission Checklist

### Before Submitting:
1. Update version number in Xcode
2. Test on multiple device sizes
3. Prepare App Store screenshots (required sizes):
   - 6.7" (iPhone 15 Pro Max): 1290 x 2796
   - 6.5" (iPhone 14 Plus): 1284 x 2778
   - 5.5" (iPhone 8 Plus): 1242 x 2208
   - 12.9" iPad Pro: 2048 x 2732

### Required App Store Assets:
- App Icon (1024x1024 PNG, no alpha)
- App Description (up to 4000 characters)
- Keywords (up to 100 characters)
- Support URL
- Privacy Policy URL

### Submit to App Store:
1. Product > Archive in Xcode
2. Window > Organizer
3. Distribute App > App Store Connect
4. Follow the upload wizard

---

## Troubleshooting

### "Pod install" fails
```bash
sudo gem install cocoapods
pod repo update
pod install
```

### Signing errors
1. Ensure you're logged into Xcode with your Apple ID
2. Go to Xcode > Preferences > Accounts
3. Add your Apple Developer account

### Build errors
1. Clean build folder: `Cmd + Shift + K`
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Run `pod install` again

### App shows blank screen
- Check internet connection
- Verify `https://app.getadaptalyfeapp.com` is accessible
- Check Xcode console for errors

---

## File Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── Info.plist          # App permissions & config
│   │   ├── public/             # Web assets (auto-synced)
│   │   ├── capacitor.config.json
│   │   ├── AppDelegate.swift
│   │   └── Assets.xcassets/    # App icons
│   ├── App.xcodeproj/
│   ├── App.xcworkspace/        # Open this in Xcode!
│   └── Podfile                 # CocoaPods dependencies
└── capacitor-cordova-ios-plugins/
```

---

## Support

For issues with the iOS build, contact the development team.
