---
name: Flutter subscription contract
description: The Flutter client uses store verification data and the existing server purchase endpoints for subscription activation.
---

Flutter subscription purchases must never contain payment secrets. The platform purchase plugin supplies base64 receipt data on Apple and a Google Play purchase token on Android through its server verification data; the client forwards those values with the existing product ID and optional transaction/order ID to the existing verification routes.

**Why:** The backend remains the authority for entitlement, expiry, platform ownership, and cross-platform duplicate-purchase protection. Store renewals and cancellations continue through the existing Apple and Google notification flows.

**How to apply:** Keep plan product IDs aligned with the server mappings, complete each platform transaction after verification handling, suppress duplicate purchase actions for active entitlements, and validate the full flow on physical store environments before release.

## Subscription change scope
Subscription fixes should stay within the purchase, restore, entitlement, and directly related test paths; do not modify unrelated app or server behavior.

**Why:** The user has repeatedly asked for subscription repairs without changes to other code.

**How to apply:** Keep diffs limited to the subscription flow and its tests. Include shared server code only when required for purchase verification or entitlement persistence.

## Bounded Google Play outage fallback
After a Play API failure, reuse only a previously verified database entitlement with a known token/product, an access-granting status, a future expiry, and a verification timestamp no older than 24 hours. Return the normalized verified entitlement in purchase/restore responses so the client can avoid relying on a second immediate store check.

**Why:** A successful, persisted purchase followed by a transient refresh failure should not deny paid access, while a bounded snapshot prevents selected-plan or indefinitely stale data from granting access.

**How to apply:** Preserve the verification-age and expiry limits, fail closed for stale, revoked, unknown-product, or mismatched-product records, and test all product tiers plus those denial cases.