# Google Play subscriptions for Adaptalyfe Flutter

This guide covers the fresh Flutter purchase client and the existing
Adaptalyfe backend. The backend remains the only authority that verifies a
purchase and grants an account entitlement. The Flutter app sends purchase
data to it; it does not store service-account credentials or decide access
from a local store response.

## Existing product and backend contract

The Android package name is `com.adaptalyfe.app`. The Flutter catalog and
backend already use these subscription product IDs:

| Plan | Google Play product ID |
| --- | --- |
| Basic | `adaptalyfe_basic_monthly` |
| Premium | `adaptalyfe_premium_monthly` |
| Family | `adaptalyfe_family_monthly` |

The product ID identifies a subscription product. Each product also needs an
active monthly auto-renewing **base plan** in Play Console. The base plan ID is
a separate value; it is not sent by the app and can be chosen in Play Console.
Product IDs and activated base plan IDs cannot be renamed later.

The client uses the existing authenticated routes:

- `GET /api/subscription` reads the latest account entitlement.
- `POST /api/google-play/verify-purchase` sends `purchaseToken`, `productId`,
  and optionally `orderId`.
- `POST /api/apple/verify-purchase` remains the client contract for an App
  Store purchase if a Flutter iOS project is configured later.
- `POST /api/google-play/notifications` receives authenticated Play RTDN
  push messages.

The Google Play verifier calls the Android Publisher API, validates the
product and subscription state, persists the shared entitlement, then
acknowledges the purchase. The Flutter client only completes the store
transaction after the backend reports successful verification. Existing
Stripe/website subscriptions and the rest of the backend are unchanged.

## 1. Configure subscriptions in Play Console

1. Open the Play Console app whose package name is exactly
   `com.adaptalyfe.app`.
2. Go to **Monetize with Play > Products > Subscriptions**.
3. Create the three products above, or open the existing products. Do not
   create duplicates if those IDs already exist.
4. For each product, add a **monthly auto-renewing base plan**. Set the
   countries/regions and prices where the plan should be sold, then activate
   the base plan. A subscription with no active base plan is not sellable.
5. Optional offers (for example, an introductory price or free trial) are
   configured separately under the subscription. Only enable an offer after
   its eligibility and billing terms are clear in Play Console. The store
   decides whether a user is eligible.
6. Save and publish the product/base-plan changes. Product availability can
   take time to propagate to test devices.

Play requires subscription offers to disclose the price, billing period,
renewal behavior, and cancellation method. The Flutter screen shows the
localized store price and links active subscribers to their store's
subscription-management page.

## 2. Add testers and install a test build

1. In Play Console, open **Settings > License testing** and add the Google
   accounts that will make test purchases.
2. Also add those accounts to the **internal testing** track's tester list.
3. Before a release build, configure the upload keystore expected by
   `android/app/build.gradle` in `android/key.properties`. The repository
   `.gitignore` excludes that file and keystore files; do not add them to the
   ZIP or source control.
4. Check the latest accepted Play `versionCode`, then set a higher build
   number in the `version: x.y.z+BUILD_NUMBER` entry in `pubspec.yaml`. Do not
   guess the next accepted code.
5. Build and upload an Android App Bundle from this Flutter project:

   ```bash
   cd mobile_flutter
   flutter pub get
   flutter build appbundle --release
   ```

   The bundle is written to
   `build/app/outputs/bundle/release/app-release.aab`.
6. Publish the build to the internal testing track and share its opt-in link.
   Open the link on the Android device while signed into the tester's Google
   account, opt in, and install/update from the Play Store.
7. Confirm the Play Store on the device is signed into that same tester
   account before starting a purchase.

Google Play license testers can also test compatible sideloaded builds when
the app is configured in Play Console and the package name and tester account
match. Installing through the internal track is still the recommended first
test because it removes package, account, signing, and distribution
ambiguities. If a direct Android Studio install says the item is unavailable,
check the package name, license-tester account on the device, published
product/base plan, and test-track eligibility before changing Flutter code.

## 3. Configure the Google Play Developer API

Use a Google Cloud project linked to the Play Console developer account:

1. In Play Console, open **Setup > API access** and link the intended Google
   Cloud project if one is not already linked.
2. In that Cloud project, enable the **Google Play Android Developer API**
   (also called the Android Publisher API).
3. Create a dedicated Google Cloud service account for server-side purchase
   verification.
4. Add that service account under Play Console **Users and permissions**.
   Grant only the permissions required by the Android Publisher API for
   subscription verification and management; Google's billing setup requires
   the **View financial data** permission.
5. Create a JSON key for that service account. Store the complete JSON only
   in the backend's secret manager as `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`.
   `server/google-play-client.ts` parses that JSON and uses the
   `androidpublisher` scope.

Keep the service-account JSON out of Flutter assets, source control, app
builds, CI logs, and device storage. Never put it in a `--dart-define`,
Firebase option, or mobile environment file. Use separate test and production
service-account configuration where appropriate. Check the existing backend
deployment before creating another key.

## 4. Run and test the Flutter client

From `mobile_flutter/`, install dependencies and run on an Android device:

```bash
flutter pub get
flutter run
```

The app uses the production API host by default. To point the build at the
staging backend instead:

```bash
flutter run \
  --dart-define=ADAPTALYFE_API_BASE_URL=https://staging.getadaptalyfeapp.com/
```

Sign into an Adaptalyfe account before opening Plans. The client:

1. Queries the actual store catalog and displays its localized price.
2. Passes the eligible Google Play offer token when starting a subscription.
3. Handles pending, purchased, restored, cancelled, and failed store events.
4. Sends a purchased token to the authenticated backend verifier.
5. Waits for successful server verification before completing the transaction
   or showing the plan as active.
6. Uses **Restore purchases** to ask the store for previous purchases and
   verifies each returned transaction against the signed-in Adaptalyfe
   account.

The current plugin constraints are `in_app_purchase ^3.3.1` and
`in_app_purchase_android ^0.5.3`. After resolving packages, confirm that the
Android implementation uses Google Play Billing Library 8 or later; Google
requires version 8+ for new apps and updates as of August 31, 2026. The
Android manifest already declares the Play Billing permission. Do not add a
second, manually pinned Billing Client dependency.

## 5. Configure Real-time developer notifications (recommended)

RTDN lets the backend learn about renewals, cancellations, grace periods,
account holds, and revocations without waiting for an app launch. It is
recommended for production; purchase verification and entitlement reads still
use the existing Android Publisher API when an app calls the backend.

### Create a Pub/Sub topic and allow Play to publish

1. In Google Cloud Console, select the project linked to Play Console and
   enable the **Cloud Pub/Sub API**.
2. Create a Pub/Sub topic, for example `adaptalyfe-play-rtdn`.
3. Open that topic's permissions and grant
   `google-play-developer-notifications@system.gserviceaccount.com` the
   **Pub/Sub Publisher** role.
4. In Play Console, open the app and go to
   **Monetize > Monetization setup > Real-time developer notifications**.
5. Enable RTDN and enter the full topic name:
   `projects/PROJECT_ID/topics/TOPIC_NAME`.
6. Choose subscription and voided-purchase notifications, then use **Send
   Test Message** to check that Google Play can publish to the topic.

### Create an authenticated push subscription

1. In Cloud Pub/Sub, create a **push** subscription on that topic. Use the
   backend endpoint for the environment being configured:

   - Production: `https://app.getadaptalyfeapp.com/api/google-play/notifications`
   - Staging: `https://staging.getadaptalyfeapp.com/api/google-play/notifications`

2. Enable OIDC authentication for the push endpoint and choose a service
   account for the push identity. Use a dedicated identity rather than the
   Android Publisher service-account key when possible.
3. Set the OIDC token audience to a stable audience string for this endpoint.
   Put that exact value in the backend secret/environment variable
   `GOOGLE_PLAY_PUBSUB_AUDIENCE`.
4. Put the selected push identity's exact email address in
   `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL`.
5. If Cloud Pub/Sub reports that its service agent cannot mint OIDC tokens,
   grant the required service-account token-creation permission as described
   by Google's authenticated push documentation.
6. In Play Console, send another test message. Confirm that the push
   subscription delivers successfully to the backend and that the backend
   accepts the OIDC audience and email.

The notification route validates the OIDC token and then queries Google Play
for authoritative subscription state; it does not treat the RTDN payload as
proof of entitlement. The API service-account secret
`GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` and the push-authentication settings above
serve different purposes.

## 6. Verify the full purchase path

Run an internal-track test with a licensed tester:

1. Confirm all three product IDs are returned by the store catalog. If not,
   check the package name, product spelling, activated base plan, country
   availability, tester account, and Play Store propagation time.
2. Start a purchase and approve the test payment in Google Play.
3. Confirm the authenticated request reaches
   `/api/google-play/verify-purchase` with the purchase token and the matching
   product ID. The token must never be written to application logs.
4. Confirm the server reports successful verification and the plan appears
   in `GET /api/subscription`.
5. Use **Restore purchases** after reinstalling or signing in again. Verify
   that access attaches to the same Adaptalyfe account, not merely the Google
   account.
6. Test cancellation, renewal, expiration, and (if used) pending payment and
   grace-period behavior with Play's test tools.
7. Test RTDN separately with Play Console's **Send Test Message** control.

An active Adaptalyfe subscription from another supported billing platform is
shared with this app. The Flutter client will not launch a second purchase
while that entitlement is active.

## Official references

- [Create and manage subscriptions in Play Console](https://support.google.com/googleplay/android-developer/answer/140504)
- [Google Play Billing setup and RTDN](https://developer.android.com/google/play/billing/getting-ready)
- [Test Google Play Billing](https://developer.android.com/google/play/billing/test)
- [Application license testing](https://support.google.com/googleplay/android-developer/answer/6062777)
- [Flutter `in_app_purchase`](https://pub.dev/packages/in_app_purchase)
- [Flutter Android purchase implementation](https://pub.dev/packages/in_app_purchase_android)
- [Authenticated Cloud Pub/Sub push subscriptions](https://cloud.google.com/pubsub/docs/push#authenticated-push-subscriptions)

## Current Flutter platform limitation

This workspace contains the Android project and iOS Runner support files, but
does not contain an Xcode project or Podfile. The Google Play Android target
can be built from this project; an iOS Flutter build still needs its normal
Xcode project setup. The existing website and Capacitor clients are separate
and are not changed by this Flutter subscription work.