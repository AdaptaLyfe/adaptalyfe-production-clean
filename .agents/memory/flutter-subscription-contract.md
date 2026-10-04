---
name: Flutter subscription contract
description: The Flutter client uses store verification data and the existing server purchase endpoints for subscription activation.
---

Flutter subscription purchases must never contain payment secrets. The platform purchase plugin supplies base64 receipt data on Apple and a Google Play purchase token on Android through its server verification data; the client forwards those values with the existing product ID and optional transaction/order ID to the existing verification routes.

**Why:** The backend remains the authority for entitlement, expiry, platform ownership, and cross-platform duplicate-purchase protection. Store renewals and cancellations continue through the existing Apple and Google notification flows.

**How to apply:** Keep plan product IDs aligned with the server mappings, complete each platform transaction after verification handling, suppress duplicate purchase actions for active entitlements, and validate the full flow on physical store environments before release.

Store-source normalization must accept the official plugin labels `GooglePlay` and `AppStore` as well as API-style underscore names.

**Why:** Matching only `google_play` or `app_store` can reject real plugin transactions even though a mocked underscore-label transaction passes.

**How to apply:** Normalize case and separators before choosing a verification endpoint, and cover the actual plugin labels in contract tests.

## Subscription change scope
Subscription fixes should stay within the purchase, restore, entitlement, and directly related test paths; do not modify unrelated app or server behavior.

**Why:** The user has repeatedly asked for subscription repairs without changes to other code.

**How to apply:** Keep diffs limited to the subscription flow and its tests. Include shared server code only when required for purchase verification or entitlement persistence.

## Bounded Google Play outage fallback
After a transient Play API outage, reuse only a previously verified database entitlement with a known token/product, an access-granting status, a future expiry, and a verification timestamp no older than 24 hours. Invalid-token responses, authorization/configuration errors, and database persistence failures must never use this fallback. Return the normalized verified entitlement in purchase/restore responses so the client can avoid relying on a second immediate store check.

**Why:** A successful, persisted purchase followed by a transient refresh failure should not deny paid access, while a bounded snapshot prevents selected-plan or indefinitely stale data from granting access.

**How to apply:** Preserve the verification-age and expiry limits, fail closed for stale, revoked, unknown-product, or mismatched-product records, and test all product tiers plus those denial cases.

## Local acknowledgement versus account access
An account entitlement already verified and persisted by the backend remains usable if the client cannot finish its local store acknowledgement. Keep acknowledgement retryable without treating the payment as unverified again.

**Why:** Store completion and account access are different operations. Failing a local plugin call after backend success must not leave someone who paid locked out or encouraged to pay again.

**How to apply:** Honor the verified payload, preserve transaction retry opportunities, and leave provider renewal and revocation checks authoritative.

## Android release version source
Android release versions should come from the Flutter Gradle extension, not a
static fallback that can ignore pubspec/build-number changes. Never guess the next
accepted Play versionCode.

**Why:** The uploaded Android project used a Gradle project-property lookup with a
fallback, which can leave a rebuilt AAB at the old code despite changing Flutter's
version settings. Play requires a higher unused code for the next accepted upload.

**How to apply:** Preserve the existing application ID and upload signing setup;
configure the next version only after checking the latest accepted Play code.