# Android Publish Folder

This folder contains all assets and files needed for Google Play Store publishing.

## Folder Structure

```
android-publish/
├── apk/                    # Place your signed APK/AAB files here
│   └── (your-signed-app.aab)
├── screenshots/            # App screenshots for store listing
│   ├── phone/             # Phone screenshots (1080x1920 recommended)
│   └── tablet/            # Tablet screenshots (optional)
├── store-listing/          # Store listing text and assets
│   └── listing.txt        # App description, titles, etc.
├── icons/                  # High-res icons for store
│   └── (512x512 app icon)
└── README.md
```

## What to Include

### APK Folder
- Your signed release APK or AAB (Android App Bundle)
- Keep previous versions for reference

### Screenshots Folder
- Minimum 2 screenshots required
- Recommended: 1080x1920 pixels for phone
- PNG or JPEG format

### Store Listing Folder
- App title (max 50 characters)
- Short description (max 80 characters)
- Full description (max 4000 characters)
- Privacy policy URL

### Icons Folder
- 512x512 PNG high-resolution icon (required)
- Feature graphic: 1024x500 PNG (recommended)

## Notes
- This folder is separate from the main android/ project folder
- Your signed APK setup in android/ remains unchanged
- Use this folder to organize publishing assets only
