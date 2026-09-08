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

The existing React frontend, backend, database, and top-level Capacitor
`android/` and `ios/` projects are separate and are not used as build inputs.