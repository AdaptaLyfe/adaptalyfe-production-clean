---
name: Stripe renewal safety
description: Durable rules for recurring web subscriptions, trial payment readiness, and isolated staging verification.
---

Web trials must use the subscription's SetupIntent to save a default payment method before granting paid access; a standalone PaymentIntent does not guarantee an auto-renewing subscription. Confirmation, recovery, and webhooks must all apply the same readiness rule for trialing subscriptions.

**Why:** Stripe marks a subscription as trialing before the card setup completes. Treating trialing alone as paid access permits a non-renewable trial to retain the paid tier.

**How to apply:** Before activating a trialing subscriber, require a succeeded pending SetupIntent or a default payment method on the Stripe subscription. Validate every account/subscription binding through Stripe metadata and match webhook updates to the stored subscription ID, never customer email or an old customer event.

Staging billing must remain on Stripe test-mode credentials with its own webhook signing secret. Test clocks may only be attached when test credentials are active.

**Why:** Vite embeds the publishable key into the built frontend, and mixing live/test Stripe objects or secrets invalidates webhook verification and risks real charges.

**How to apply:** Rebuild staging after changing its Stripe test publishable key. Keep production live keys only in production; do not roll them into staging after tests.
