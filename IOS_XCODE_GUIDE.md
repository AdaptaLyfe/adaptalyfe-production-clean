# Adaptalyfe iOS — Complete Xcode Build & Deployment Guide

---

## Requirements

| Tool | Minimum Version | Where to Get |
|---|---|---|
| **Xcode** | **15.0** (Xcode 16 recommended) | Mac App Store |
| **macOS** | Ventura 13.5+ (Sonoma recommended) | System Update |
| **iOS Deployment Target** | **14.0** (already set in project) | — |
| **Apple Developer Account** | Paid ($99/year) | developer.apple.com |
| **CocoaPods** | 1.13+ | `sudo gem install cocoapods` |
| **Node.js** | 18+ | nodejs.org |

---

## Part 1 — Prepare the Web Build

Before opening Xcode, build the web app and sync it into the iOS project.

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets into iOS project
npx cap sync ios
```

This copies the built web files into `ios/App/App/public/`.

---

## Part 2 — Install iOS Pods

```bash
cd ios/App
pod install
cd ../..
```

This installs Capacitor and all required native dependencies.

> If pod install fails, try: `pod repo update` then `pod install` again.

---

## Part 3 — Open the Project in Xcode

**Always open the `.xcworkspace` file, NOT the `.xcodeproj` file.**

```bash
open ios/App/App.xcworkspace
```

Or in Finder: navigate to `ios/App/` and double-click `App.xcworkspace`.

---

## Part 4 — Add the AppleStoreKit Plugin Files to Xcode

The plugin files are already created at:
- `ios/App/App/AppleStoreKitPlugin.swift`
- `ios/App/App/AppleStoreKitPlugin.m`

Xcode may need you to add them to the target:

1. In Xcode, right-click the **App** folder in the Project Navigator
2. Click **Add Files to "App"**
3. Select both `AppleStoreKitPlugin.swift` and `AppleStoreKitPlugin.m`
4. Check **"Add to target: App"** → Click **Add**

---

## Part 5 — Configure Signing

1. In Xcode, click the **App** project at the top of the navigator
2. Select the **App** target → **Signing & Capabilities** tab
3. Under **Signing**:
   - Check **"Automatically manage signing"**
   - Set **Team** to your Apple Developer account
   - **Bundle Identifier**: `com.adaptalyfe.app` (already set)

---

## Part 6 — Add In-App Purchase Capability

**This is required for StoreKit / App Store subscriptions.**

1. In **Signing & Capabilities** tab, click **"+ Capability"** (top-left button)
2. Search for **"In-App Purchase"**
3. Double-click it — it appears in the capabilities list
4. ✅ Done — no extra code needed, StoreKit is now enabled

---

## Part 7 — Set Up Products on App Store Connect

Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and:

1. Navigate to your app → **Subscriptions** tab
2. Create a **Subscription Group** (e.g., "Adaptalyfe Plans")
3. Add these 3 products:

| Product ID | Price | Reference Name |
|---|---|---|
| `adaptalyfe_basic_monthly` | $4.99/month | Basic Monthly |
| `adaptalyfe_premium_monthly` | $12.99/month | Premium Monthly |
| `adaptalyfe_family_monthly` | $24.99/month | Family Monthly |

4. For each product, fill in:
   - **Display Name**: e.g., "Basic Plan"
   - **Description**: Short description of plan benefits
   - **Price**: Set the correct price tier
5. Submit each product for review (or they can be reviewed with the app)

---

## Part 8 — Add Shared Secret (Required for Server Verification)

1. On App Store Connect → **Subscriptions** tab → **App-Specific Shared Secret**
2. Click **Generate** → copy the 32-character hex string
3. Add it as an environment variable on Railway:
   - Variable name: `APPLE_SHARED_SECRET`
   - Value: (the hex string from step 2)

This lets the server verify Apple receipts with Apple's servers.

---

## Part 9 — Build & Run on Device

### On a Real Device (for StoreKit testing):
1. Connect your iPhone via USB
2. In Xcode, select your device from the top device menu
3. Press **Run (▶)** or `Cmd+R`
4. Trust the developer certificate on your iPhone:
   - Go to **Settings → General → VPN & Device Management → Trust**

### Simulator Note:
The Simulator **cannot process real purchases**. Use a real iPhone for subscription testing.

---

## Part 10 — Test In-App Purchases (Sandbox)

1. On your iPhone, go to **Settings → App Store → Sandbox Account**
2. Sign in with your **Apple Sandbox tester account** (create at App Store Connect → Users → Sandbox Testers)
3. Open the Adaptalyfe app → go to **Subscription page**
4. Tap a plan → **Apple purchase sheet appears** with "Sandbox Environment" label
5. Complete the purchase — no real charge occurs
6. Check Railway logs to confirm `/api/apple/verify-purchase` was called

> Note: Sandbox purchases expire much faster (e.g., 1 month = 5 minutes in sandbox). This is Apple's design for testing.

---

## Part 11 — Archive & Upload to App Store

When ready to submit:

1. In Xcode, set the scheme to **Any iOS Device (arm64)**
2. Menu: **Product → Archive**
3. Wait for build to complete → **Organizer** window opens
4. Click **Distribute App** → choose **App Store Connect**
5. Follow the wizard → Xcode uploads the build automatically

Then on App Store Connect:
1. Select your uploaded build under the app's **TestFlight** or **App Store** tab
2. Fill in app metadata, screenshots (required: 6.5" and 5.5" iPhone)
3. Submit for review

---

## Part 12 — Environment Variable Checklist (Railway)

Make sure these are set before going live:

| Variable | Required For |
|---|---|
| `DATABASE_URL` | Database |
| `STRIPE_SECRET_KEY` | Web subscriptions |
| `VITE_STRIPE_PUBLIC_KEY` | Web subscriptions |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Android verification |
| `APPLE_SHARED_SECRET` | **iOS receipt verification** |
| `VITE_FIREBASE_API_KEY` | Analytics |
| `VITE_FIREBASE_PROJECT_ID` | Analytics |
| `VITE_FIREBASE_APP_ID` | Analytics |

---

## Subscription Flow Summary

```
iOS App (Capacitor)
    ↓ User taps plan
AppleStoreKitPlugin.swift
    ↓ SKPaymentQueue purchase
Apple App Store
    ↓ Returns receipt (base64)
client/src/lib/apple-store-billing.ts
    ↓ POST /api/apple/verify-purchase
server/routes.ts
    ↓ Validates receipt with Apple servers
    ↓ Updates DB: subscriptionStatus = 'active'
App unlocks immediately
```

---

## Common Issues & Fixes

| Issue | Fix |
|---|---|
| "Cannot connect to iTunes Store" | Check sandbox account in Settings |
| Plugin not found at runtime | Confirm both .swift and .m files added to target |
| Pods install fails | Run `pod repo update` then `pod install` |
| Build error: "Signing certificate" | Set your team in Signing & Capabilities |
| Receipt verification fails | Check `APPLE_SHARED_SECRET` is set on Railway |
| "StoreKit not available" | Must run on real device, not simulator |
| App crashes on launch | Open `.xcworkspace` not `.xcodeproj` |
