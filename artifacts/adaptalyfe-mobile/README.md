# AdaptaLyfe Mobile

Native Flutter companion for AdaptaLyfe. It uses the existing API's native bearer-session contract (`X-Adaptalyfe-Client: native`).

## Configure and run

Install Flutter stable (Dart 3.3+), then:

```sh
flutter pub get
flutter run --dart-define=API_BASE_URL=https://your-api.example
```

`API_BASE_URL` must be an `http(s)` origin without a trailing slash. The intentionally safe development default is `http://10.0.2.2:5000` (Android emulator); use your machine LAN address for a physical device or `http://127.0.0.1:5000` for iOS Simulator. No production domain or credentials are embedded in the app.

Run checks with `flutter analyze` and `flutter test`; build with `flutter build apk` or `flutter build ipa`.

## Native projects

`android/` and `ios/` are generated Flutter runner projects with native entry points, launch resources, Gradle settings, Xcode workspace/project files, and square Adaptalyfe app icons. Run `flutter pub get` first to create local plugin/configuration files. Never commit `android/local.properties`, Pods, or `Generated.xcconfig`. Open `android/` in Android Studio or `ios/Runner.xcworkspace` in Xcode.

## Architecture

`lib/core` holds configuration, API transport/errors, and secure persistence. `lib/features/auth` separates data, domain, and presentation. Routes are declared once in `app.dart`. The home is deliberately a module launcher; module detail APIs are not invented beyond the existing API contract.