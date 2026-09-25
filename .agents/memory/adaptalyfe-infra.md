---
name: Adaptalyfe infrastructure notes
description: Key deployment facts, DB connections, and environment variable conventions for Adaptalyfe.
---

## Staging URL
https://staging.getadaptalyfeapp.com  
GitHub repo: Adaptalyfe/adaptalyfe-production-clean  
Deploy branch: ai-staging  
Platform: Railway

Staging can lag the workspace branch: verify the live asset hash and API behavior before assuming current source is deployed. Railway staging is separate from Replit deployment metadata.

**Why:** A web create failure was reproduced on staging while the same browser-cookie flow succeeded locally; the live bundle was older than the workspace and Replit deployment metadata pointed to a different public app.

**How to apply:** For staging-only bugs, reproduce against the staging domain, compare the served asset/build version with the current branch, and redeploy the Railway ai-staging branch after verifying the local fix.

## Database connections — CRITICAL
The app has TWO separate DB connection strings in the environment:
- `DATABASE_URL` — used by Drizzle ORM (`server/db.ts`) and by the running app. **Always use this for any data that must reach the app.**
- `NEON_DATABASE_URL` — separate connection; does NOT feed the app, but it matches the Railway/Replit production Neon endpoint and is valid for read-only production backups. Never use it for app writes or tests.

**Why:** `server/db.ts` reads only `DATABASE_URL`. Any raw SQL test or seed script must also use `DATABASE_URL`.

For production backups, `NEON_DATABASE_URL` may be used with `pg_dump` after confirming its hostname matches the live production endpoint. Do not substitute it for the app's `DATABASE_URL`.

## Railway Variables (confirmed present)
DATABASE_URL, OPENAI_API_KEY, SESSION_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLIC_KEY, APPLE_SHARED_SECRET, GOOGLE_PLAY_SERVICE_ACCOUNT_KEY, NODE_ENV

## Key decisions
- subscriptionStatus='active' is trusted as the sole auth gate on both client and server — no stripeSubscriptionId or expiry date required.
- Mobile bottom nav uses Wouter setLocation (not window.history.replaceState) for Android WebView compatibility.
- Daily guide sends browser localDate/localTime/timezone in POST body so AI uses user's local time, not server UTC.

## Production schema changes
Replit-managed production schema changes are applied through the Publish schema-diff flow; the production database query interface is read-only for agents.

**Why:** Production DDL outside Publish is unsafe and unsupported, while development and production can be out of sync after a schema change.

**How to apply:** Update the shared Drizzle schema and migration source, verify development, then publish and accept the non-destructive table/column creation prompt.

## Railway staging schema migrations
Railway staging uses an external database and is not managed by Replit's Publish schema-diff flow. Apply narrow SQL migrations explicitly in the Railway service environment using its app `DATABASE_URL`; do not run DDL automatically on every deploy or startup.

**Why:** Railway's build/start configuration does not apply repository SQL migrations, and the Replit development database can already be migrated while staging remains stale.

**How to apply:** Check the target column type, run only the needed migration through the Railway service's app connection, and verify afterward. `NEON_DATABASE_URL` remains read-only.

## Development schema drift
The development database can lag behind `shared/schema.ts`; a declared table may be missing even while the app starts normally.

**Why:** Runtime queries fail only when a feature first uses the missing relation, so builds and startup logs do not prove schema readiness.

**How to apply:** Before testing a new persistence-backed feature, verify its tables in development and sync only the development schema with the database tools. Keep production changes on the Publish schema-diff path.

## Deployed schema drift
The deployed database can also lag behind the shared schema; broad ORM selects against newly added columns or tables can turn a read-only dashboard request into a 500.

**Why:** The deployed database lacked the daily-task creation-date column and completion table while the running code queried both.

**How to apply:** Prefer capability-aware reads for transitional deployments, log the underlying exception, and still synchronize the deployed schema through the supported deployment migration flow.

Avoid unqualified ORM `returning()` calls while supporting a legacy table shape. Even when an update only writes old columns, `returning()` can implicitly select every modeled column and fail on a deployed database that lacks a newer column.

**Why:** Daily-task completion fallback still returned HTTP 500 because its update implicitly requested the missing creation-date column.

**How to apply:** Execute compatibility updates without broad returning clauses, then re-read through the same capability-aware selector used by normal reads.
