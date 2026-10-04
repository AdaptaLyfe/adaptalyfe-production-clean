# Install subscription fixes into your latest uploaded Flutter project

Base archive: `adaptalyfe-flutter-main_1791101615561.zip`.
Project folder inside that archive: `adaptalyfe-flutter-main/`.

This patch is based on that archive's paths. It includes the supporting earlier
subscription fixes as well as the current audit fixes. It is not a full-project
replacement. Keep a backup before overwriting files.

## 1. Apply the backend first

Backend changes are already present in the Replit workspace. For a separate
Railway repository, copy these exact files from the backend patch package:

Replace:
- `server/routes.ts`
- `server/google-play-entitlement.ts`
- `server/google-play-entitlement.test.ts`

Add:
- `server/subscription-access.ts`
- `server/subscription-access.test.ts`

These are full files, not snippets. If your Railway repository has independent
newer route changes, merge rather than overwrite those changes.

Run:
```sh
npx tsx --test server/google-play-entitlement.test.ts server/subscription-access.test.ts
npm run build
```

Commit the backend changes to the branch used by your Railway service and deploy
that branch through your existing Railway process. Its configured start command
is `node dist/production.js`, so the build must run before startup.

Keep website Stripe configuration and routes. No new database table or new
migration was added by this patch. The existing subscription/Google Play fields
and ownership indexes were confirmed in development, not independently in the
Railway production database.

## 2. Replace these Flutter files

Close running debug/build processes, extract the Flutter patch separately, then
copy the listed files into your actual `adaptalyfe-flutter-main/` project root,
preserving paths. The patch's outer folder is also `adaptalyfe-flutter-main/`.
Do not accidentally create a nested
`adaptalyfe-flutter-main/adaptalyfe-flutter-main/` project.

Replace these **16 existing files**:
1. `android/app/build.gradle`
2. `lib/main.dart`
3. `lib/app/app_navigation.dart`
4. `lib/app/routes.dart`
5. `lib/features/auth/bloc/auth_bloc.dart`
6. `lib/features/medical/presentation/medical_screen.dart`
7. `lib/features/meal_shopping/presentation/meal_shopping_screen.dart`
8. `lib/features/subscription/bloc/subscription_bloc.dart`
9. `lib/features/subscription/bloc/subscription_event.dart`
10. `lib/features/subscription/bloc/subscription_state.dart`
11. `lib/features/subscription/data/purchase_service.dart`
12. `lib/features/subscription/data/subscription_api.dart`
13. `lib/features/subscription/data/subscription_repository.dart`
14. `lib/features/subscription/models/subscription_models.dart`
15. `lib/features/subscription/models/subscription_purchase_contract.dart`
16. `lib/features/subscription/presentation/subscription_screen.dart`

Add these **2 implementation files**:
17. `lib/features/subscription/subscription_access.dart`
18. `lib/features/subscription/presentation/premium_feature_gate.dart`

Add these **5 regression-test files**:
- `test/features/subscription/subscription_auth_refresh_state_test.dart`
- `test/features/subscription/subscription_purchase_contract_test.dart`
- `test/features/subscription/subscription_models_test.dart`
- `test/features/subscription/subscription_bloc_test.dart`
- `test/features/subscription/subscription_platform_policy_test.dart`

The Gradle replacement changes only version mapping: it uses
`flutter.versionCode` and `flutter.versionName` instead of the old fallback.
Package ID, SDK/NDK configuration and release signing references are preserved.
The source-name helper preserves support for the official plugin labels
`GooglePlay` and `AppStore` as well as underscore-style API names.

`lib/app/app.dart` is deliberately not included: its differences from the ZIP
are unrelated theme changes.

## 3. Remove the obsolete Flutter Stripe service

Delete this file if it exists:
```text
lib/features/subscription/data/stripe_payment_service.dart
```

Do not remove any website/backend Stripe files. This deletion is only for the
old Flutter payment flow. The replacements remove its imports and startup
configuration.

## 4. Edit pubspec.yaml manually

Do not replace your whole pubspec or lockfile. Preserve app assets and unrelated
dependencies.

Use this SDK section:
```yaml
environment:
  sdk: ">=3.10.0 <4.0.0"
  flutter: ">=3.38.0"
```

Inside the existing `dependencies:` section:
- Remove `flutter_stripe: ^10.2.0`.
- Use `in_app_purchase: ^3.3.0`.
- Add/uncomment `in_app_purchase_android: ^0.5.0`.

Do not create a second `dependencies:` section.

Example of the relevant two dependency entries:
```yaml
  in_app_purchase: ^3.3.0
  in_app_purchase_android: ^0.5.0
```

Check `flutter --version`. Use a Flutter SDK that satisfies the requirements;
this environment did not run pub get or a Flutter build.

## 5. Set the next Android version

Find the highest accepted versionCode in your existing Play Console app.
In `pubspec.yaml`, set the integer after `+` in `version:` to a higher number.
Keep or change the versionName before `+` as appropriate for your release.

Example format only: `version: 0.1.0+NEXT_CODE`.
Replace `NEXT_CODE` with an actual integer; do not paste that placeholder
literally. Do not assume 14 or 15 is the latest accepted code.

The updated Gradle file reads this configured Flutter version. Do not change
`applicationId = "com.adaptalyfe.app"`, your upload keystore, key.properties,
Firebase files, or signing passwords.

## 6. Resolve, check and build

Run from the Flutter project root:
```sh
flutter --version
flutter clean
flutter pub get
flutter analyze
flutter test test/features/subscription
flutter build appbundle --release
```

Fix any reported compilation or test errors before upload. These Flutter checks
could not be executed in Replit because the Flutter/Dart SDK is unavailable.

Expected AAB output:
```text
build/app/outputs/bundle/release/app-release.aab
```

## 7. Upload to the existing internal-testing track

Use your existing Play Console app and products. No duplicate app or duplicate
subscription products are needed:
- `adaptalyfe_basic_monthly`
- `adaptalyfe_premium_monthly`
- `adaptalyfe_family_monthly`

Use the accepted upload key, a higher versionCode, internal-track testers and
license-test payment methods. Do not make a real-money test purchase unless
you intend and authorize the charge.

Check each tier for:
- Card selection without payment or paid access.
- Explicit payment followed by verified access.
- Correct Basic/Premium/Family feature restrictions.
- Reopen, reinstall and another device using the same Adaptalyfe account.
- Active versus expired Restore using the Google Play account that paid.
- Pending/network recovery without another purchase.
- Cross-account restore rejection.

The backend must be deployed too; an AAB upload does not update server code.
No live Google Play payment or physical-device recovery was verified here.