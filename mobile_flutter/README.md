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

The existing React frontend, backend, database, and top-level Capacitor
`android/` and `ios/` projects are separate and are not used as build inputs.