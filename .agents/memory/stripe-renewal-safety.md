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

Stripe subscription billing periods may be exposed on the subscription item rather than only on the top-level subscription in newer Stripe API payloads.

**Why:** Assuming only `subscription.current_period_end` can produce an invalid date and repeated webhook HTTP 500 retries when Stripe sends a newer object shape.

**How to apply:** Webhook and confirmation code should prefer the top-level period end but fall back to the first subscription item's period end, and fail with an explicit diagnostic when neither is valid.
