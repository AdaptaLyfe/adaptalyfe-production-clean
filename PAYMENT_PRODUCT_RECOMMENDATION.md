# Adaptalyfe — Product payment recommendation

**Primary recommendation:** Subscription SaaS + Freemium

---

## Choose → Why for Adaptalyfe

| Choose | Why for Adaptalyfe |
|--------|-------------------|
| **Subscription SaaS** | Core product is ongoing life-support software (tasks, caregivers, health) — needs recurring access and updates |
| **Freemium / trial** | Already in product: free default + 7-day trial + Basic / Premium / Family |
| **Monthly + yearly** | Matches landing + Stripe + Apple; Play monthly first |
| **Fixed Stripe Price IDs** | Pro ops; stops duplicate products (`STRIPE_PRICE_*`) |
| **Store IAP on mobile** | Required for digital subscriptions in iOS/Android apps |

---

## One-line decision

> Adaptalyfe = **subscription product company** (Basic / Premium / Family × monthly / yearly), with freemium/trial; ecommerce or usage only as **separate** add-ons later.

---

## Plan catalog (what to sell)

| Plan key | Display name | Monthly | Yearly (annual) |
|----------|--------------|---------|-----------------|
| `basic` | Basic | $4.99 | $49.99 |
| `premium` | Premium | $12.99 | $129.99 |
| `family` | Family / Care Team | $24.99 | $249.99 |

- API billing cycle: `monthly` \| `annual`  
- Free trial: **7 days**  
- Package / bundle: `com.adaptalyfe.app`

---

## What NOT to use as the core model

| Avoid as core | Why |
|---------------|-----|
| Pure ecommerce cart for plans | Plans are entitlements, not inventory SKUs |
| Marketplace | No seller payouts in current product |
| Donation-only | Cannot fund cloud + support reliably |
| One-time license only | Ongoing server/AI costs need renewals |
| Usage-only billing | Too complex as the only model |

---

## Keys vs per-user IDs (quick)

| Type | Same for all users? | Example |
|------|---------------------|---------|
| Company keys / Price IDs | **Yes** (per env) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PREMIUM_MONTHLY` |
| Customer billing IDs | **No** (per user) | `stripe_customer_id`, `stripe_subscription_id`, Apple/Play tokens |

---

## Database

**No new columns required** for this recommendation. Existing `users` subscription fields are enough. Price IDs and API keys stay in **environment variables**.

---

## Full detail

See [`PAYMENT_INTEGRATION_GUIDE.md`](./PAYMENT_INTEGRATION_GUIDE.md) for all business models, Stripe/Apple/Play APIs, and key management.
