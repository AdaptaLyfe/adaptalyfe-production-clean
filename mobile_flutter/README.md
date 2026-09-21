# Adaptalyfe Flutter Mobile

Separate Flutter client scaffold for Adaptalyfe.

This project is intentionally structure-only. Authentication, API calls, session
restoration, persistence behavior, and Home data loading will be implemented in
later work.

## Platforms

- Android project files live in `android/`.
- iOS project files live in `ios/`.
- Dart application code lives in `lib/`.

## Local setup

1. Install Flutter and configure Android/iOS toolchains.
2. Run `flutter pub get`.
3. Run `flutter run` from this directory.

## Firebase Analytics configuration

The native app uses `firebase_core` and `firebase_analytics` with explicit
Android/iOS `FirebaseOptions`. Firebase client configuration is public
application configuration; no server secrets are stored in the app.

Provide the platform app values at build time (use the values from the
Firebase project, without committing them):

```bash
flutter run \
  --dart-define=FIREBASE_PROJECT_ID=<project-id> \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=<sender-id> \
  --dart-define=FIREBASE_ANDROID_API_KEY=<android-api-key> \
  --dart-define=FIREBASE_ANDROID_APP_ID=<android-app-id> \
  --dart-define=FIREBASE_IOS_API_KEY=<ios-api-key> \
  --dart-define=FIREBASE_IOS_APP_ID=<ios-app-id>
```

`FIREBASE_STORAGE_BUCKET` is optional. The app safely disables analytics when
these options are absent, so authentication and feature flows continue to
work in unconfigured development environments.

## Native notifications

Native notification handling is separate from the server notification BLoC:

- `/api/notifications` and `/api/notifications/:id/read` remain the source of
  server notification data and read state.
- `NativeNotificationService` owns Android/iOS permissions, Firebase
  Messaging, foreground presentation, background handling, notification taps,
  and local scheduling.
- Medication, appointment, daily check-in, and emergency local notifications
  do not require a backend change.

Android declares `POST_NOTIFICATIONS` and uses the
`adaptalyfe_general` high-importance channel. iOS registers for remote
notifications and enables the remote-notification background mode. For real
Firebase/APNs delivery, the Firebase project must also have the mobile Android
app configured and the iOS app configured with APNs credentials/capability.

The current backend does not expose a device-token registration or FCM send
route. The Flutter client therefore does not invent one or send tokens to an
unsupported endpoint; Firebase Messaging is ready for provider-delivered
messages while the existing server notification API remains unchanged.

The existing React frontend, backend, database, and top-level Capacitor
`android/` and `ios/` projects are separate and are not used as build inputs.

## Stripe card and wallet subscriptions

The Flutter subscription screen keeps the existing App Store/Google Play
purchase flow and additionally uses Stripe PaymentSheet when a publishable key
is supplied. It supports:

- Credit/debit card on both mobile platforms.
- Google Pay on Android when Google Pay is available and configured.
- Apple Pay on iOS when Apple Pay is available and configured.

The Flutter app never receives or stores a Stripe secret key, card number, or
wallet token. The existing backend `/api/create-subscription` and
`/api/confirm-subscription` routes create and verify the recurring Stripe
subscription.

Build with the non-secret client configuration:

```bash
flutter pub get
flutter run \
  --dart-define=ADAPTALYFE_API_BASE_URL=https://staging.getadaptalyfeapp.com/ \
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_... \
  --dart-define=STRIPE_MERCHANT_IDENTIFIER=merchant.com.adaptalyfe.app \
  --dart-define=STRIPE_MERCHANT_COUNTRY_CODE=US
```

For Android, enable Google Pay in the Google Pay/Stripe account settings and
use a physical Android device with Google Pay configured. The manifest wallet
flag and `FlutterFragmentActivity` are already included.

For iOS, register `merchant.com.adaptalyfe.app` in the Apple Developer account,
enable Apple Pay for the app identifier, attach the merchant capability to the
Runner target, and use a physical device with a supported card in Apple Wallet.
The merchant entitlement is included in `ios/Runner/Runner.entitlements`; the
Runner Xcode target must reference this file if the generated iOS project does
not do so automatically.

Use Stripe test keys and test store accounts during development. The backend
must have its existing Stripe configuration and webhook handling enabled
before live subscriptions are offered.