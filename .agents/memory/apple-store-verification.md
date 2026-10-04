---
name: Apple App Store server verification
description: Durable verification policy for Apple native subscriptions.
---

Use App Store Server API transaction and subscription-status data for Apple purchase verification, restores, and refreshes. Verify App Store Server Notifications V2 signed payloads; do not reintroduce shared-secret `verifyReceipt` or V1 notification handling.

**Why:** Store entitlements must be server-authoritative across production and sandbox purchases, renewals, cancellations, grace periods, and refunds. Client purchase status or an unverified notification is not sufficient evidence.

**How to apply:** Keep the Flutter client forwarding store transaction/receipt data to the existing backend contract. Resolve access from verified Apple records, bind the original transaction to one Adaptalyfe account, and process signed V2 notifications idempotently.