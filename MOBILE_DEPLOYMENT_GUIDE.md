# Mobile App Deployment Guide

Complete guide for deploying Adaptalyfe iOS and Android apps to the App Store and Google Play Store.

---

## Prerequisites

### Required Accounts
1. **Apple Developer Account** - $99/year
   - Sign up at: https://developer.apple.com
   - Required for iOS app submission
   
2. **Google Play Console Account** - $25 one-time
   - Sign up at: https://play.google.com/console
   - Required for Android app submission

### Required Tools
- **Xcode** (macOS only) - For iOS builds
- **Android Studio** - For Android builds
- **Capacitor CLI** - Already installed via npm

---

## Part 1: iOS Deployment (App Store)

### Step 1: Apple Developer Account Setup

1. **Enroll in Apple Developer Program:**
   - Go to https://developer.apple.com
   - Click "Account" → "Enroll"
   - Pay $99 annual fee
   - Wait for approval (1-2 business days)

2. **Create App ID:**
   - Log in to https://developer.apple.com/account
   - Go to "Certificates, Identifiers & Profiles"
   - Click "Identifiers" → "+" button
   - Select "App IDs" → Continue
   - Fill in:
     - Description: `Adaptalyfe`
     - Bundle ID: `com.adaptalyfe.app` (must match Capacitor config)
     - Capabilities: Enable needed features (Push Notifications, etc.)
   - Click "Continue" → "Register"

3. **Create Certificates:**
   
   **a) Development Certificate:**
   ```bash
   # On macOS, generate CSR (Certificate Signing Request)
   # Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
   # Save to disk
   ```
   - Upload CSR to developer.apple.com → Certificates → "+"
   - Select "iOS App Development"
   - Download and double-click to install
   
   **b) Distribution Certificate:**
   - Same process as above, but select "iOS Distribution"

4. **Create Provisioning Profiles:**
   
   **Development Profile:**
   - Certificates → Profiles → "+"
   - Select "iOS App Development"
   - Select your App ID
   - Select your development certificate
   - Select test devices
   - Name it: `Adaptalyfe Development`
   - Download and double-click to install
   
   **Distribution Profile:**
   - Select "App Store" distribution
   - Select your App ID and distribution certificate
   - Name it: `Adaptalyfe Distribution`
   - Download and double-click to install

### Step 2: Configure Xcode Project

1. **Open iOS project:**
   ```bash
   npx cap open ios
   ```

2. **In Xcode:**
   - Select `App` target
   - General tab:
     - Display Name: `Adaptalyfe`
     - Bundle Identifier: `com.adaptalyfe.app`
     - Version: `1.0.0` (update for each release)
     - Build: `1` (increment for each build)
   
3. **Signing & Capabilities tab:**
   - Uncheck "Automatically manage signing" (if using manual profiles)
   - Or check it and select your team (easier for beginners)
   - Select provisioning profiles
   - Add capabilities: Push Notifications, Background Modes, etc.

4. **Build Settings:**
   - Set "Code Signing Identity" to your distribution certificate
   - Set "Provisioning Profile" to your distribution profile

### Step 3: Create App in App Store Connect

1. **Go to App Store Connect:**
   - https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"

2. **Fill in app information:**
   - Platform: iOS
   - Name: `Adaptalyfe`
   - Primary Language: English (U.S.)
   - Bundle ID: Select `com.adaptalyfe.app`
   - SKU: `adaptalyfe-ios` (unique identifier)
   - User Access: Full Access

3. **App Information:**
   - Subtitle: `Grow with Guidance. Thrive with Confidence.`
   - Category: Medical or Health & Fitness
   - Content Rights: Check if you own all content
   - Age Rating: Complete questionnaire
   - Privacy Policy URL: (Your privacy policy URL)
   - Support URL: (Your support website)

4. **Pricing and Availability:**
   - Price: Free (or select tier)
   - Availability: All countries (or select specific)

### Step 4: Build and Upload iOS App

1. **Build for release:**
   ```bash
   # Make sure web app is built first
   npm run build
   
   # Sync to iOS
   npx cap sync ios
   
   # Open in Xcode
   npx cap open ios
   ```

2. **In Xcode:**
   - Select "Any iOS Device" or "Generic iOS Device" as destination
   - Product → Archive
   - Wait for archive to complete
   - Organizer window opens automatically

3. **Upload to App Store:**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Click "Upload"
   - Select distribution certificate and profile
   - Click "Upload"
   - Wait for processing (10-30 minutes)

### Step 5: Submit for Review

1. **In App Store Connect:**
   - Go to your app → "1.0 Prepare for Submission"
   - Add screenshots (required sizes):
     - 6.7" Display (iPhone 14 Pro Max): 1290 x 2796
     - 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
     - 5.5" Display (iPhone 8 Plus): 1242 x 2208
     - 12.9" iPad Pro: 2048 x 2732
   
2. **Add app preview video** (optional but recommended)

3. **Fill in required fields:**
   - Description (4000 characters max)
   - Keywords (100 characters max, comma-separated)
   - Support URL
   - Marketing URL (optional)
   
4. **Build:**
   - Select the build you just uploaded
   - Answer export compliance questions
   
5. **App Review Information:**
   - Contact information
   - Demo account (if app requires login)
   - Notes for reviewer
   
6. **Version Release:**
   - Select "Automatically release" or "Manually release"
   
7. **Submit for Review**
   - Click "Submit for Review"
   - Wait 1-7 days for approval

---

## Part 2: Android Deployment (Google Play Store)

### Step 1: Google Play Console Setup

1. **Create Developer Account:**
   - Go to https://play.google.com/console/signup
   - Pay $25 one-time registration fee
   - Complete developer profile

2. **Create New App:**
   - Click "Create app"
   - Fill in:
     - App name: `Adaptalyfe`
     - Default language: English (United States)
     - App or game: App
     - Free or paid: Free
     - Declarations: Check all boxes
   - Click "Create app"

### Step 2: Configure Android Project

1. **Update app information:**
   
   **In `android/app/build.gradle`:**
   ```gradle
   android {
       defaultConfig {
           applicationId "com.adaptalyfe.app"
           minSdkVersion 22
           targetSdkVersion 33
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. **Generate Signing Key:**
   ```bash
   # In android/app directory
   keytool -genkey -v -keystore adaptalyfe-release-key.keystore \
     -alias adaptalyfe-key-alias \
     -keyalg RSA -keysize 2048 -validity 10000
   
   # Enter password (remember it!)
   # Fill in organization details
   ```
   
   **IMPORTANT:** Keep this keystore file safe! You cannot update your app without it.

3. **Configure Signing:**
   
   **Create `android/key.properties`:**
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=adaptalyfe-key-alias
   storeFile=../app/adaptalyfe-release-key.keystore
   ```
   
   **Add to `.gitignore`:**
   ```
   android/key.properties
   android/app/*.keystore
   ```
   
   **Update `android/app/build.gradle`:**
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   
   android {
       ...
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

### Step 3: Build Android App Bundle

1. **Build web app and sync:**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **In Android Studio:**
   - Build → Generate Signed Bundle / APK
   - Select "Android App Bundle"
   - Create new key store (or use existing from Step 2)
   - Fill in key store details
   - Select "release" build variant
   - Click "Finish"
   - AAB file location: `android/app/release/app-release.aab`

3. **Or build from command line:**
   ```bash
   cd android
   ./gradlew bundleRelease
   # Output: android/app/build/outputs/bundle/release/app-release.aab
   ```

### Step 4: Complete Play Console Setup

1. **App Content:**
   - Privacy Policy: Add URL
   - App Access: Declare if app requires login
   - Ads: Declare if app contains ads
   - Content Rating: Complete questionnaire
   - Target Audience: Select age groups
   - News Apps: No (unless applicable)
   - COVID-19 Contact Tracing: No (unless applicable)
   - Data Safety: Fill in data collection practices

2. **Store Listing:**
   - App name: `Adaptalyfe`
   - Short description: 80 characters
   - Full description: 4000 characters
   - App icon: 512 x 512 PNG
   - Feature graphic: 1024 x 500 JPG/PNG
   - Screenshots:
     - Phone: At least 2 (1080 x 1920 recommended)
     - 7" Tablet: At least 2 (optional)
     - 10" Tablet: At least 2 (optional)
   - App category: Medical or Health & Fitness
   - Contact details: Email and website
   
3. **Pricing & Distribution:**
   - Countries: Select all or specific
   - Price: Free
   - Content Guidelines: Accept
   - US export laws: Accept

### Step 5: Upload and Release

1. **Create Release:**
   - Go to "Production" → "Create new release"
   - Upload AAB file from Step 3
   - Release name: `1.0.0` (or version number)
   - Release notes: Describe what's new
   
2. **Review Release:**
   - Check for warnings or errors
   - Review all sections
   
3. **Roll out to Production:**
   - Click "Review release"
   - Click "Start rollout to Production"
   - Confirm rollout
   
4. **Wait for Review:**
   - Initial review: 1-7 days
   - You'll receive email when approved
   - App goes live automatically after approval

---

## Part 3: Testing Before Submission

### iOS Testing

**TestFlight (Beta Testing):**
```bash
# Build and archive in Xcode
# Distribute → App Store Connect
# Select "TestFlight"
# Add internal/external testers
# Testers receive email invitation
```

**Local Testing:**
```bash
# Build and run on connected device
npx cap open ios
# Select your device in Xcode
# Click Run (▶️)
```

### Android Testing

**Internal Testing:**
- Play Console → Testing → Internal testing
- Upload AAB
- Add tester emails
- Testers can download via Play Store

**Local Testing:**
```bash
# Install on connected device
npx cap open android
# Select your device in Android Studio
# Click Run (▶️)

# Or via command line:
cd android
./gradlew installDebug
```

---

## Part 4: Updating Your App

### iOS Updates

1. **Increment version:**
   - Xcode → General → Version: `1.0.1` (or 1.1.0 for features)
   - Build number: Always increment (2, 3, 4...)

2. **Build and upload:**
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   # Archive → Upload to App Store
   ```

3. **In App Store Connect:**
   - Create new version
   - Add "What's New" text
   - Submit for review

### Android Updates

1. **Increment version in `android/app/build.gradle`:**
   ```gradle
   versionCode 2  // Always increment
   versionName "1.0.1"  // Semantic versioning
   ```

2. **Build and upload:**
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

3. **In Play Console:**
   - Production → Create new release
   - Upload new AAB
   - Add release notes
   - Roll out to production

---

## Part 5: Common Issues & Solutions

### iOS Issues

**Issue: "No valid provisioning profiles"**
- Solution: Create/download provisioning profiles from developer.apple.com

**Issue: "Code signing error"**
- Solution: Make sure certificates are installed in Keychain

**Issue: "Build failed in Xcode"**
- Solution: Clean build folder (Cmd+Shift+K), then rebuild

**Issue: "App rejected for missing functionality"**
- Solution: Ensure all features work, provide test account credentials

### Android Issues

**Issue: "Keystore not found"**
- Solution: Check `key.properties` path, ensure keystore file exists

**Issue: "Build failed: SDK not found"**
- Solution: Open Android Studio, install required SDK versions

**Issue: "App not installable"**
- Solution: Check minimum SDK version (22+), ensure signing is configured

**Issue: "Upload rejected: duplicate version"**
- Solution: Increment versionCode in build.gradle

---

## Part 6: Maintenance Checklist

### Monthly:
- [ ] Check for Capacitor updates: `npm outdated`
- [ ] Update plugins: `npm update @capacitor/*`
- [ ] Test on latest iOS/Android versions
- [ ] Review crash reports (App Store Connect, Play Console)

### Before Each Release:
- [ ] Test all core features on real devices
- [ ] Update version numbers (iOS build, Android versionCode)
- [ ] Write release notes
- [ ] Create app screenshots if UI changed
- [ ] Test payment flows (if applicable)
- [ ] Verify API endpoints are production-ready

### After Approval:
- [ ] Monitor crash reports for 48 hours
- [ ] Check user reviews
- [ ] Respond to user feedback
- [ ] Document any issues for next release

---

## Part 7: Marketing Assets Checklist

### Required for Both Stores:

**App Icon:**
- [ ] 1024x1024 PNG (no transparency, no rounded corners)

**Screenshots:**
- [ ] iPhone 6.7" (1290x2796) - at least 2
- [ ] iPhone 6.5" (1242x2688) - at least 2
- [ ] Android Phone (1080x1920) - at least 2

**Feature Graphic (Android only):**
- [ ] 1024x500 JPG/PNG

**Descriptions:**
- [ ] Short description (80 chars - Android only)
- [ ] Full description (up to 4000 chars)
- [ ] Keywords/tags (100 chars - iOS only)
- [ ] What's New / Release notes

**Legal:**
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Terms of Service URL (if applicable)

---

## Quick Reference Commands

```bash
# Full deployment workflow

# 1. Build web app
npm run build

# 2. Sync to native platforms
npx cap sync

# 3. Open in native IDE
npx cap open ios      # For iOS
npx cap open android  # For Android

# 4. Build for release
# iOS: Xcode → Product → Archive
# Android: ./gradlew bundleRelease

# 5. Test locally
npx cap run ios
npx cap run android

# Update Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync
```

---

## Support Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Apple Developer:** https://developer.apple.com/support/
- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Play Store Policies:** https://play.google.com/about/developer-content-policy/

---

## Next Steps

1. ✅ Complete mobile setup (done)
2. ✅ Configure iOS and Android settings (done)
3. 🔄 Generate app icons and splash screens → See `MOBILE_ASSETS_GUIDE.md`
4. 🔄 Test on real devices
5. 🔄 Create developer accounts
6. 🔄 Submit to stores

Your Adaptalyfe mobile apps are now ready for deployment! 🚀
