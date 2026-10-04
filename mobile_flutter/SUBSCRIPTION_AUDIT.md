# Android subscription audit and internal-test checklist

Audit date: 2026-10-04.

## Latest-ZIP handoff

The later file handoff was checked against
`adaptalyfe-flutter-main_1791101615561.zip`. Use
`SUBSCRIPTION_ZIP_INSTALL.md` for the complete replacement/addition list against
that archive, including supporting subscription changes from the earlier baseline.

During that comparison, official `GooglePlay`/`AppStore` source-label support was
restored in `lib/features/subscription/models/subscription_purchase_contract.dart`,
and its regression test was expanded. The new BLoC tests were corrected to call
the existing positional constructor. `android/app/build.gradle` now uses Flutter's
configured version rather than the old versionCode fallback. These additional
Flutter changes were inspected but not compiled here; the SDK limitation remains.

## Result and limits

Focused subscription fixes are implemented locally. This is **not** a confirmation of a live Google Play charge or a successful Android release build.

- Card taps select a plan; only the explicit purchase button opens billing.
- A selected plan cannot grant paid access. The old session-only upgrade route no longer grants a mock trial.
- A free account trial provides Basic access and permits checkout. A verified provider subscription/trial prevents another platform purchase.
- Native access requires a known Basic/Premium/Family plan and a future verified expiry. Cancelled subscriptions retain access until expiry; expired, pending, held, paused and revoked subscriptions do not.
- Account recovery reads the backend entitlement before store product discovery. A valid account entitlement can work after reopening, reinstalling, or signing in on another device without another purchase.
- Purchase/restore responses supply the normalized verified entitlement. Local completion failures cannot hide a persisted entitlement.
- Pending payments and retryable verification failures block another checkout and remain recoverable through Restore.
- App-wide resume refreshes subscription state; successful purchase/restore refreshes authentication outside the subscription screen too.
- Backend feature checks read the account record rather than a stale session tier. Premium/Family checks cover meal/shopping, medication/refill, and academic APIs; Family membership remains Family-only.
- Linked replacement tokens cannot be claimed from another Adaptalyfe account.
- A bounded cached Play entitlement is used only for transient provider failures. Invalid tokens, configuration/authorization errors, and database persistence failures cannot use that fallback.
- Persistence checks require matching tier, status, platform, token, product, transaction, verification timestamp, and exact verified expiry.
- Stripe remains website-only. No Flutter Stripe payment flow was added.

Existing user-record storage is sufficient; no new subscription table or schema migration was added.

## Checks actually run

| Check | Result |
| --- | --- |
| `npx tsx --test server/google-play-entitlement.test.ts server/subscription-access.test.ts` | 16 passed, 0 failed |
| Focused TypeScript check of both entitlement/access helpers and their tests | Passed |
| `npm run build` | Passed; existing bundle-size/import/Browserslist warnings remain |
| `git diff --check` | Passed |
| Development database subscription/Google Play column metadata | Required existing columns present |
| Development database unique token and platform/transaction indexes | Both present |
| Restart `Start application` and inspect startup logs | Running on port 5000, no startup crash |
| Unauthenticated subscription, medication, meal-plan, Family-member GET requests and upgrade POST | All return 401 |
| Web landing-page snapshot | Page renders; existing development-preview styling mismatch and Firebase analytics configuration warning remain outside this scope |
| Flutter/Dart analysis, Flutter tests, Android AAB build | Not run: Flutter/Dart SDK unavailable here |
| Real Play purchase, deduction, renewal, reinstall and second-device tests | Not run: require an internal-track build and tester/device |
| Railway production database or live publisher authorization | Not independently inspected by this audit |

The full project TypeScript check has a previously documented unrelated syntax-error baseline in `caregiver-dashboard-broken.tsx`; the focused check and production build are the checks used here.

## Exact implementation and regression-test files

### Backend
- `server/routes.ts`
- `server/google-play-entitlement.ts`
- `server/google-play-entitlement.test.ts`
- `server/subscription-access.ts` — new
- `server/subscription-access.test.ts` — new

### Flutter implementation
- `mobile_flutter/lib/app/app_navigation.dart`
- `mobile_flutter/lib/app/routes.dart`
- `mobile_flutter/lib/features/meal_shopping/presentation/meal_shopping_screen.dart`
- `mobile_flutter/lib/features/subscription/bloc/subscription_bloc.dart`
- `mobile_flutter/lib/features/subscription/bloc/subscription_state.dart`
- `mobile_flutter/lib/features/subscription/data/purchase_service.dart`
- `mobile_flutter/lib/features/subscription/models/subscription_models.dart`
- `mobile_flutter/lib/features/subscription/presentation/premium_feature_gate.dart`
- `mobile_flutter/lib/features/subscription/presentation/subscription_screen.dart`

### Flutter regression tests (added/updated, not executed here)
- `mobile_flutter/test/features/subscription/subscription_bloc_test.dart` — new
- `mobile_flutter/test/features/subscription/subscription_models_test.dart`
- `mobile_flutter/test/features/subscription/subscription_platform_policy_test.dart`

### Report and project decision notes
- `mobile_flutter/SUBSCRIPTION_AUDIT.md` — this report
- `.agents/memory/flutter-subscription-contract.md`
- `.agents/memory/cross-platform-billing.md`

## Before uploading the next internal build

1. Run in a Flutter-enabled environment:
   ```sh
   cd mobile_flutter
   flutter pub get
   flutter analyze
   flutter test test/features/subscription
   ```
2. Build/sign an AAB with the existing accepted upload key and a versionCode greater than the latest accepted Play build. No version bump was guessed in this audit.
3. Deploy the backend source changes to the production backend used by the app. Uploading only an AAB does not update server verification or feature gates.
4. Keep package ID `com.adaptalyfe.app` and the existing product IDs:
   - `adaptalyfe_basic_monthly`
   - `adaptalyfe_premium_monthly`
   - `adaptalyfe_family_monthly`
5. Confirm internal-track access, license-test eligibility, and the intended Google Play account on each test device.
6. Confirm production publisher authorization and notification delivery using the deployed configuration. Absence of a Play service-account secret in Replit does not establish absence in Railway.

## Live internal-test matrix

Run purchase/access/recovery scenarios separately for **Basic, Premium and Family**.

| Scenario | Expected |
| --- | --- |
| Tap a plan card | Selection changes; no payment sheet, no paid entitlement |
| Press explicit purchase button and cancel | No new paid access; checkout can be tried again |
| Complete a purchase | Store confirms payment; backend verifies and persists the mapped plan before the client grants access |
| Basic purchase | Basic access; meal, medication and academic premium gates remain closed |
| Premium purchase | Premium modules open; Family membership remains blocked |
| Family purchase | Premium modules and Family membership open |
| Reopen the app | Same account restores its verified tier; no second purchase offered |
| Reinstall and sign in to the same Adaptalyfe account | Current entitlement returns from the backend |
| Sign in on another Android device with the same Adaptalyfe account | Current entitlement works without another charge |
| Access missing, Restore with the paying Google Play account | Only an active/unexpired owned subscription restores its tier |
| Restore an expired/invalid subscription | No paid access; checkout remains available after a definitive inactive result |
| Cancel renewal while the period is still paid | Access continues until the verified expiry |
| Renewal expiry/account hold/revocation | Paid features stop; old status alone cannot keep access |
| Payment pending or server/network unavailable during verification | No unverified paid access and no duplicate checkout; Restore/replayed transactions can recover |
| Temporary local completion failure after server success | Persisted access remains available; completion can retry |
| Restore under another Adaptalyfe account | Ownership error; do not transfer the purchase or buy again to work around it |

For each paid case, inspect the deployed account record for the correct plan, provider, product, status, token/order linkage, verified timestamp and expiry. Do not share token values or credentials in chat. Record only the build versionName/versionCode, product ID, scenario, expected/actual result, and any non-sensitive error message.