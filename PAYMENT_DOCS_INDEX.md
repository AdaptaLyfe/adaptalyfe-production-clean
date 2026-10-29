# Adaptalyfe — Payment docs & deliverables index

**Last updated:** 2026-10-29  
**Branch:** `ai-staging`  
**Product decision:** Subscription SaaS + Freemium (Basic / Premium / Family × monthly / yearly)

This is the **final checklist** of everything created for payment / subscription work: how many files, what each is for, and what the product requires.

---

## How many files were created?

| # | Count | Category |
|---|------:|----------|
| A | **3** | Full integration guide (`.md` + `.pdf` + `.docx`) |
| B | **3** | Short product recommendation (`.md` + `.pdf` + `.docx`) |
| C | **3** | This index (`.md` + `.pdf` + `.docx`) |
| D | **2** | Code: fixed Stripe Price IDs helper + unit tests |
| E | **1** | App change: `create-subscription` uses env Price IDs |
| | **12** | **Total new/updated deliverables in this package** |

*(Related existing doc, not created in this package: `mobile_flutter/GOOGLE_PLAY_SUBSCRIPTIONS_SETUP.md`)*

---

## A) Full guide — all models, keys, APIs, DB

| File | Format | Purpose |
|------|--------|---------|
| [`PAYMENT_INTEGRATION_GUIDE.md`](./PAYMENT_INTEGRATION_GUIDE.md) | Markdown (source of truth) | E2E: business models, SaaS vs ecommerce, recommendation, Stripe/Apple/Play, key management, APIs, **no DB migration needed** |
| [`PAYMENT_INTEGRATION_GUIDE.pdf`](./PAYMENT_INTEGRATION_GUIDE.pdf) | PDF | Same content for sharing / print |
| [`PAYMENT_INTEGRATION_GUIDE.docx`](./PAYMENT_INTEGRATION_GUIDE.docx) | Word | Same content for editing in Word |

**Inside the guide you will find:**

1. All business models (subscription, ecommerce, freemium, usage, license, marketplace, donation, hybrid)  
2. Adaptalyfe primary recommendation table (Choose / Why)  
3. Plan catalog + store product IDs  
4. Company keys vs per-user customer IDs (with examples)  
5. API map (`GET /api/subscription`, create/confirm, Apple/Play verify)  
6. Database: **no new columns required**

---

## B) Short recommendation — “this type” one-pager

| File | Format | Purpose |
|------|--------|---------|
| [`PAYMENT_PRODUCT_RECOMMENDATION.md`](./PAYMENT_PRODUCT_RECOMMENDATION.md) | Markdown | Short **Choose / Why for Adaptalyfe** brief |
| [`PAYMENT_PRODUCT_RECOMMENDATION.pdf`](./PAYMENT_PRODUCT_RECOMMENDATION.pdf) | PDF | Share with stakeholders |
| [`PAYMENT_PRODUCT_RECOMMENDATION.docx`](./PAYMENT_PRODUCT_RECOMMENDATION.docx) | Word | Editable one-pager |

**Primary recommendation table:**

| Choose | Why for Adaptalyfe |
|--------|-------------------|
| Subscription SaaS | Ongoing life-support software — needs recurring access |
| Freemium / trial | Free default + 7-day trial + Basic / Premium / Family |
| Monthly + yearly | Landing + Stripe + Apple; Play monthly first |
| Fixed Stripe Price IDs | Pro ops; stops duplicates (`STRIPE_PRICE_*`) |
| Store IAP on mobile | Required for iOS/Android digital subscriptions |

---

## C) This index (how many + inventory)

| File | Format | Purpose |
|------|--------|---------|
| [`PAYMENT_DOCS_INDEX.md`](./PAYMENT_DOCS_INDEX.md) | Markdown | Lists **how many** docs/files and what each contains |
| [`PAYMENT_DOCS_INDEX.pdf`](./PAYMENT_DOCS_INDEX.pdf) | PDF | Same index for sharing |
| [`PAYMENT_DOCS_INDEX.docx`](./PAYMENT_DOCS_INDEX.docx) | Word | Same index editable |

---

## D) Code implemented (product requirement)

| File | Purpose |
|------|---------|
| [`server/stripe-plan-prices.ts`](./server/stripe-plan-prices.ts) | Resolve plan → fixed Stripe Price from env |
| [`server/stripe-plan-prices.test.ts`](./server/stripe-plan-prices.test.ts) | Unit tests |
| [`server/routes.ts`](./server/routes.ts) | `POST /api/create-subscription` uses env Prices (production: no auto-create) |

### Env vars to set (staging = test prices, production = live prices)

```bash
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_ANNUAL=price_...
```

Also keep: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`.

---

## What the product requires (final)

| Required | Status |
|----------|--------|
| Subscription SaaS + Freemium | Documented + already in product |
| Plans Basic / Premium / Family × monthly / yearly | Documented; Play monthly in code today |
| Fixed Stripe Price IDs in env | **Code done** — add IDs in Railway/env |
| Stripe + Apple + Google integrations | Already in codebase; documented |
| `GET /api/subscription` entitlement | Already exists |
| DB column changes | **Not required** |
| Ecommerce as core | **Not recommended** |

---

## Reading order

1. **Stakeholders / quick:** `PAYMENT_PRODUCT_RECOMMENDATION.pdf`  
2. **Engineers / ops (full):** `PAYMENT_INTEGRATION_GUIDE.md` (or `.pdf`)  
3. **Inventory of files:** this index  
4. **Android Play setup:** `mobile_flutter/GOOGLE_PLAY_SUBSCRIPTIONS_SETUP.md`

---

## File count summary (copy/paste)

```
PAYMENT_INTEGRATION_GUIDE.md
PAYMENT_INTEGRATION_GUIDE.pdf
PAYMENT_INTEGRATION_GUIDE.docx
PAYMENT_PRODUCT_RECOMMENDATION.md
PAYMENT_PRODUCT_RECOMMENDATION.pdf
PAYMENT_PRODUCT_RECOMMENDATION.docx
PAYMENT_DOCS_INDEX.md
PAYMENT_DOCS_INDEX.pdf
PAYMENT_DOCS_INDEX.docx
server/stripe-plan-prices.ts
server/stripe-plan-prices.test.ts
server/routes.ts (updated)
```

**Docs package:** 9 documentation files (3+3+3)  
**Code package:** 2 new + 1 updated  
**Grand total tracked here:** 12
