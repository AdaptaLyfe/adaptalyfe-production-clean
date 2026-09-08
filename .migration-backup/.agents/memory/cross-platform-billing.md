---
name: Cross-platform billing
description: Product policy for honoring subscriptions across web, iOS, and Android without duplicate charges.
---

An active subscription belongs to the Adaptalyfe account and grants access on web, iOS, and Android, regardless of whether it was purchased through Stripe, Google Play, or the Apple App Store. Renewal remains with the billing provider where the user originally purchased.

**Why:** App installation is not a subscription transfer. Offering a second purchase to an already entitled account risks duplicate recurring charges and can overwrite the displayed billing source.

**How to apply:** Read the account entitlement before showing a payment action. An active subscriber should see access and their existing billing source, not another checkout. Keep backend guards so cross-platform purchase verification cannot replace an already active subscription.