# Mobile App Icons and Splash Screens Guide

## App Icons

### iOS Icon Requirements

You need to provide app icons in the following sizes for iOS:

**App Store and Device Icons:**
- **1024x1024** - App Store Icon (Required)
- 180x180 - iPhone @3x
- 120x120 - iPhone @2x  
- 167x167 - iPad Pro @2x
- 152x152 - iPad @2x
- 76x76 - iPad
- 60x60 - iPhone (notification)
- 40x40 - iPad (spotlight)
- 29x29 - Settings

**Where to add them:**
1. Open Xcode project: `npx cap open ios`
2. Select `App` target
3. Go to `Assets.xcassets` > `AppIcon`
4. Drag and drop your icon images into the appropriate slots

**iOS Icon Requirements:**
- PNG format
- No transparency
- Square images
- Rounded corners will be added automatically by iOS

### Android Icon Requirements

Android uses adaptive icons with separate foreground and background layers:

**Icon Sizes Needed:**
- **512x512** - Google Play Store Icon
- 192x192 - xxxhdpi
- 144x144 - xxhdpi
- 96x96 - xhdpi
- 72x72 - hdpi
- 48x48 - mdpi

**Where to add them:**
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

**Android Icon Requirements:**
- PNG format
- For adaptive icons: provide separate foreground (logo) and background (solid color or pattern)
- Foreground should have safe area of 108x108 dp (center 72x72 dp visible area)

---

## Splash Screens

### iOS Splash Screen

**Current Configuration:**
The splash screen is already configured in `capacitor.config.ts`:

```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: "#ffffff",
  showSpinner: true,
  spinnerColor: "#6366f1"
}
```

**To customize splash screen:**

1. **Using Launch Storyboard (Recommended):**
   - Open Xcode: `npx cap open ios`
   - Navigate to `App/App/LaunchScreen.storyboard`
   - Design your splash screen in Interface Builder
   - Add logo image to Assets.xcassets

2. **Using Static Images (Alternative):**
   - Create PNG images for different screen sizes
   - Add to Assets.xcassets as "LaunchImage"

**iOS Splash Screen Sizes:**
- iPhone 14 Pro Max: 1290x2796
- iPhone 14 Pro: 1179x2556
- iPhone SE: 750x1334
- iPad Pro 12.9": 2048x2732

### Android Splash Screen

**Current Setup:**
Android splash screen is defined in `android/app/src/main/res/values/styles.xml`

**To customize:**

1. **Add splash screen image:**
   ```
   android/app/src/main/res/drawable/
   └── splash.png (1024x1024 recommended)
   ```

2. **Update styles.xml:**
   ```xml
   <style name="AppTheme.SplashScreen" parent="Theme.AppCompat.NoActionBar">
       <item name="android:background">@drawable/splash</item>
   </style>
   ```

**Android Splash Screen Best Practices:**
- Use 9-patch drawable for different screen sizes
- Or provide multiple sizes in drawable-hdpi, drawable-xhdpi, etc.
- Keep design simple - complex images may not scale well

---

## Quick Icon Generation

### Online Tools (Free):
1. **App Icon Generator** - https://www.appicon.co
   - Upload 1024x1024 image
   - Generates all iOS and Android sizes
   
2. **MakeAppIcon** - https://makeappicon.com
   - Similar to above, generates all sizes

3. **Capacitor Assets** - https://github.com/ionic-team/capacitor-assets
   - Official Capacitor tool
   - Install: `npm install @capacitor/assets --save-dev`
   - Usage: `npx capacitor-assets generate --iconBackgroundColor '#ffffff' --iconForegroundColor '#6366f1'`

### Manual Creation:
1. Design your app icon at 1024x1024 in Figma/Photoshop
2. Export as PNG
3. Use ImageMagick to resize:
   ```bash
   # iOS icons
   convert icon-1024.png -resize 180x180 icon-180.png
   convert icon-1024.png -resize 120x120 icon-120.png
   # etc...
   
   # Android icons
   convert icon-1024.png -resize 192x192 android-192.png
   convert icon-1024.png -resize 144x144 android-144.png
   # etc...
   ```

---

## Testing Icons and Splash Screens

### iOS:
```bash
npx cap open ios
# Run on simulator or device from Xcode
# Check: App icon on home screen, splash screen on launch
```

### Android:
```bash
npx cap open android
# Run on emulator or device from Android Studio
# Check: App icon in app drawer, splash screen on launch
```

---

## Adaptalyfe Branding

Based on your current brand:
- **Primary Color**: #6366f1 (Indigo/Purple)
- **Background**: White (#ffffff)
- **Logo**: "Adaptalyfe" text with tagline "Grow with Guidance. Thrive with Confidence."

**Recommended Icon Design:**
- Simple, recognizable symbol
- 2-3 colors maximum
- Avoid text in icon (too small to read)
- Use brand colors
- Ensure it looks good on both light and dark backgrounds
