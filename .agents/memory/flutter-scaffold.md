---
name: Flutter scaffold verification
description: The workspace does not include the Flutter SDK, so mobile scaffolds require SDK-side dependency and build verification.
---

The Flutter SDK is not available in the current Replit workspace. Flutter project files can be added safely, but `flutter pub get`, analyzer checks, and Android/iOS builds must be run later in an environment with Flutter and the platform toolchains installed.

The Android Studio Flutter project under `mobile_flutter/` is the working baseline for future mobile changes. Keep it separate from the React/server application and the root Capacitor projects, and preserve workspace fixes and tests when syncing Android Studio updates. Do not copy signing keys, signing properties, or generated build caches into the project.

**Why:** The user wants future Flutter work to follow the Android Studio project structure without losing the workspace's verified behavior or exposing signing material.

**How to apply:** Keep Flutter work isolated in `mobile_flutter/`; do not claim compilation has passed until an SDK-enabled environment verifies it.