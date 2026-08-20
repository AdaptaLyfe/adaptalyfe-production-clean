---
name: Adaptalyfe infrastructure notes
description: Key deployment facts, DB connections, and environment variable conventions for Adaptalyfe.
---

## Staging URL
https://staging.getadaptalyfeapp.com  
GitHub repo: Adaptalyfe/adaptalyfe-production-clean  
Deploy branch: ai-staging  
Platform: Railway

## Database connections — CRITICAL
The app has TWO separate DB connection strings in the environment:
- `DATABASE_URL` — used by Drizzle ORM (`server/db.ts`) and by the running app. **Always use this for any data that must reach the app.**
- `NEON_DATABASE_URL` — separate connection; does NOT feed the app. Using it for inserts/tests will appear to work but the app will never see the data.

**Why:** `server/db.ts` reads only `DATABASE_URL`. Any raw SQL test or seed script must also use `DATABASE_URL`.

## Railway Variables (confirmed present)
DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLIC_KEY, APPLE_SHARED_SECRET, GOOGLE_PLAY_SERVICE_ACCOUNT_KEY, NODE_ENV

## Key decisions
- subscriptionStatus='active' is trusted as the sole auth gate on both client and server — no stripeSubscriptionId or expiry date required.
- Mobile bottom nav uses Wouter setLocation (not window.history.replaceState) for Android WebView compatibility.
- Daily guide sends browser localDate/localTime/timezone in POST body so AI uses user's local time, not server UTC.
