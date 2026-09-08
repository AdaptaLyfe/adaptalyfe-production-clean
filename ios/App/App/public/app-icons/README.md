# Adaptalyfe App Icons
*Complete set of app icons for iOS and Android app store submission*

## Icon Design
- **Source:** Adaptalyfe dual-head silhouettes with flourishing plant design
- **Colors:** Blue-green gradient (#4FC3F7 to #26C6DA)
- **Background:** Navy blue (#1A202C) for contrast
- **Style:** Modern, accessible, professional

## iOS Icon Sizes (Required)

### App Store & System Icons
- **1024x1024** - App Store listing (PNG, no transparency, no rounded corners)
- **180x180** - iPhone @3x (iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus, X, XS, XS Max, 11 Pro Max)
- **120x120** - iPhone @2x (iPhone 6, 6s, 7, 8, SE 2nd gen, 12 mini, 13 mini)
- **152x152** - iPad @2x (iPad Pro 12.9", Air 2, mini 4)
- **76x76** - iPad @1x (iPad Pro 12.9", Air 2, mini 4)
- **167x167** - iPad Pro @2x (12.9" 2nd gen)

### Additional iOS Sizes (Optional)
- **60x60** - iPhone @1x (Legacy)
- **87x87** - iPhone @3x (Settings)
- **58x58** - iPhone @2x (Settings)
- **29x29** - iPhone @1x (Settings)

## Android Icon Sizes (Required)

### Play Store & Launcher Icons
- **512x512** - Google Play Store listing (PNG)
- **192x192** - XXXHDPI (480dpi) - High-end phones
- **144x144** - XXHDPI (320dpi) - Most modern phones
- **96x96** - XHDPI (240dpi) - Standard phones
- **72x72** - HDPI (160dpi) - Older phones
- **48x48** - MDPI (120dpi) - Very old phones

### Adaptive Icons (Android 8.0+)
- **Foreground:** 108x108dp safe area within 192x192dp canvas
- **Background:** Solid color or simple pattern
- **Mask:** System applies circular, squircle, or rounded square

## Design Guidelines

### Accessibility Requirements
- **High Contrast:** Logo visible against both light and dark backgrounds
- **Scalability:** Readable at smallest size (48x48)
- **Color Blind Friendly:** Distinguishable without color
- **Simple Design:** Clear at all sizes without fine details

### App Store Guidelines
- **iOS Human Interface Guidelines:**
  - No transparency in 1024x1024 App Store icon
  - System applies rounded corners automatically
  - Avoid placing content in corners that will be masked
  - Design fills entire icon area

- **Android Material Design:**
  - Icon may be cropped into various shapes
  - Ensure key elements are in safe zone
  - Support adaptive icon system
  - Consistent with Material Design principles

## File Organization
```
app-icons/
├── ios/
│   ├── Icon-1024.png (1024x1024)
│   ├── Icon-180.png (180x180)
│   ├── Icon-152.png (152x152)
│   ├── Icon-120.png (120x120)
│   ├── Icon-76.png (76x76)
│   └── Icon-167.png (167x167)
├── android/
│   ├── Icon-512.png (512x512)
│   ├── Icon-192.png (192x192)
│   ├── Icon-144.png (144x144)
│   ├── Icon-96.png (96x96)
│   ├── Icon-72.png (72x72)
│   └── Icon-48.png (48x48)
└── adaptive/
    ├── foreground.png
    └── background.png
```

## Implementation Notes

### iOS Xcode Integration
1. Import icons into Xcode project
2. Add to Assets.xcassets/AppIcon.appiconset
3. Configure Info.plist icon references
4. Verify all sizes display correctly

### Android Studio Integration
1. Place icons in res/mipmap-* directories
2. Update AndroidManifest.xml icon reference
3. Configure adaptive icon if using
4. Test on various device shapes and sizes

## Quality Checklist
- [ ] All required sizes generated
- [ ] Consistent design across all sizes
- [ ] High contrast and accessibility compliant
- [ ] No transparency in App Store icon (iOS)
- [ ] Proper file naming convention
- [ ] Optimized file sizes
- [ ] Testing on actual devices

## Brand Consistency
- Matches Adaptalyfe web application favicon
- Consistent with app loading screens
- Aligns with marketing materials
- Reflects "Grow with Guidance. Thrive with Confidence." brand message