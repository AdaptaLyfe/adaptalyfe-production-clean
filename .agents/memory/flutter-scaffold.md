---
name: Flutter scaffold verification
description: The workspace does not include the Flutter SDK, so mobile scaffolds require SDK-side dependency and build verification.
---

The Flutter SDK is not available in the current Replit workspace. Flutter project files can be added safely, but `flutter pub get`, analyzer checks, and Android/iOS builds must be run later in an environment with Flutter and the platform toolchains installed.

**Why:** The existing project uses React + Capacitor and the available toolchain does not provide Flutter commands.

**How to apply:** Keep Flutter work isolated in the sibling mobile project and do not claim Flutter compilation has passed until an SDK-enabled environment verifies it.