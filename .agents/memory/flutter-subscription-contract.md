---
name: Flutter subscription contract
description: The Flutter client uses store verification data and the existing server purchase endpoints for subscription activation.
---

Flutter subscription purchases must never contain payment secrets. The platform purchase plugin supplies base64 receipt data on Apple and a Google Play purchase token on Android through its server verification data; the client forwards those values with the existing product ID and optional transaction/order ID to the existing verification routes.

**Why:** The backend remains the authority for entitlement, expiry, platform ownership, and cross-platform duplicate-purchase protection. Store renewals and cancellations continue through the existing Apple and Google notification flows.

**How to apply:** Keep plan product IDs aligned with the server mappings, complete each platform transaction after verification handling, suppress duplicate purchase actions for active entitlements, and validate the full flow on physical store environments before release.