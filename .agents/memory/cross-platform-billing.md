---
name: Cross-platform billing
description: Product policy for honoring subscriptions across web, iOS, and Android without duplicate charges.
---

An active subscription belongs to the Adaptalyfe account and grants access on web, iOS, and Android, regardless of whether it was purchased through Stripe, Google Play, or the Apple App Store. Renewal remains with the billing provider where the user originally purchased.

**Why:** App installation is not a subscription transfer. Offering a second purchase to an already entitled account risks duplicate recurring charges and can overwrite the displayed billing source.

**How to apply:** Read the account entitlement before showing a payment action. An active subscriber should see access and their existing billing source, not another checkout. Keep backend guards so cross-platform purchase verification cannot replace an already active subscription.

New mobile subscriptions and restores use Apple App Store or Google Play billing. Stripe checkout remains on the website; do not add Stripe PaymentSheet to Flutter unless the product owner explicitly changes this policy.

**Why:** The product owner confirmed the website-only Stripe boundary while adopting the Android Studio Flutter project.

**How to apply:** Keep native purchase flows on the existing store verification routes and leave website Stripe billing unchanged.

## Basic versus Premium feature access
An active Basic subscription grants Basic features only. Premium- and Family-only feature gates remain closed for Basic subscribers.

**Why:** The product owner confirmed that Basic should remain limited to its listed features; restoring a Basic purchase must not accidentally grant the higher-tier feature set.

**How to apply:** When recovering or refreshing a Basic entitlement, mark the plan active without relaxing Premium/Family checks. Change this policy only after an explicit plan decision.