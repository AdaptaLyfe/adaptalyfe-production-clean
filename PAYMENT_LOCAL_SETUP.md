# Adaptalyfe — Local product & payment setup

**Written for local / staging development.**  
**Product decision (locked):**

> **Subscription SaaS + Freemium** · **Basic / Premium / Family** · **monthly + yearly** · **env `STRIPE_PRICE_*`** · **no DB column changes**

---

## 1. What our product is

| Item | Value |
|------|--------|
| Business model | **Subscription SaaS + Freemium** |
| Plans | **`basic`** · **`premium`** · **`family`** |
| Billing | **`monthly`** + **`annual`** (yearly on landing → use `annual` in API) |
| Trial | **7 days** (`FREE_TRIAL_DAYS`) |
| Web payments | **Stripe** subscriptions |
| iOS | **Apple IAP** |
| Android | **Google Play** (monthly products in code today) |
| Database | **No new columns** — use existing `users` subscription fields |
| Stripe Prices | **Fixed IDs in `.env`** (`STRIPE_PRICE_*`) — production will not auto-create |

---

## 2. Plan catalog (local reference)

| Plan key | Display | Monthly | Yearly (`annual`) |
|----------|---------|---------|-------------------|
| `basic` | Basic | $4.99 (499¢) | $49.99 (4999¢) |
| `premium` | Premium | $12.99 (1299¢) | $129.99 (12999¢) |
| `family` | Family / Care Team | $24.99 (2499¢) | $249.99 (24999¢) |

Store product ID style: `adaptalyfe_{plan}_{monthly\|annual}`

---

## 3. Local `.env` — company keys (shared, not per user)

Already used locally:

- `STRIPE_SECRET_KEY` — use **`sk_test_…`** for local
- `VITE_STRIPE_PUBLIC_KEY` — use **`pk_test_…`** for local
- `STRIPE_WEBHOOK_SECRET` — test webhook secret if testing webhooks

**Add these six (paste Price IDs from Stripe Test Dashboard):**

```bash
# Fixed Stripe Price IDs (TEST mode for local)
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxxxxx
STRIPE_PRICE_BASIC_ANNUAL=price_xxxxxxxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxxxxx
STRIPE_PRICE_PREMIUM_ANNUAL=price_xxxxxxxx
STRIPE_PRICE_FAMILY_MONTHLY=price_xxxxxxxx
STRIPE_PRICE_FAMILY_ANNUAL=price_xxxxxxxx
```

| Rule | Detail |
|------|--------|
| Same for all local users? | **Yes** — company catalog |
| Different per user? | **No** — users get `stripe_customer_id` / `stripe_subscription_id` in DB |
| Local vs production | Local/staging = **test** `price_…`; production = **live** `price_…` |

If these six are empty in **development**, the server may still search/create by metadata (dev fallback).  
In **production**, missing vars → checkout error (no auto-create).

---

## 4. Per-user data (database — already exists)

No migration. Each user row already has:

- `subscription_tier`, `subscription_status`, `subscription_platform`
- `stripe_customer_id`, `stripe_subscription_id`
- Apple / Google Play fields when applicable

**Do not** put `STRIPE_SECRET_KEY` or `STRIPE_PRICE_*` in the database.

---

## 5. Local run checklist

1. Postgres or Neon via `.env` `DATABASE_URL`  
2. `PORT=3000` · `NODE_ENV=development`  
3. Stripe **test** keys + optional six `STRIPE_PRICE_*`  
4. `npm run dev` → http://localhost:3000  
5. Log in → `/subscription` → choose Basic/Premium/Family monthly or yearly  
6. `GET /api/subscription` should return that user’s plan  

---

## 6. Related docs

| Doc | Use |
|-----|-----|
| [`PAYMENT_PRODUCT_RECOMMENDATION.md`](./PAYMENT_PRODUCT_RECOMMENDATION.md) | Short Choose / Why table |
| [`PAYMENT_INTEGRATION_GUIDE.md`](./PAYMENT_INTEGRATION_GUIDE.md) | Full E2E + all business models |
| [`PAYMENT_DOCS_INDEX.md`](./PAYMENT_DOCS_INDEX.md) | How many files / inventory |
| [`server/stripe-plan-prices.ts`](./server/stripe-plan-prices.ts) | Code that reads `STRIPE_PRICE_*` |

---

## 7. One-line summary (copy)

```
Subscription SaaS + Freemium · Basic/Premium/Family · monthly+yearly · env STRIPE_PRICE_* · no DB column changes
```
