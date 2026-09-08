---
name: Adaptalyfe mobile backend boundary
description: The mobile client must reuse the existing Adaptalyfe API and PostgreSQL-backed backend.
---

The Adaptalyfe mobile app is a client only. It must use the existing Node.js/Express REST API, existing session-token authentication, and existing PostgreSQL data; do not add a mobile-specific backend, database, or parallel auth flow.

**Why:** The web and mobile products must share the same accounts, sessions, and user data without creating divergent behavior or duplicate persistence.

**How to apply:** Keep mobile network calls centralized in the API client/repository layer and reuse the established routes (`/api/login`, `/api/register`, `/api/logout`, and `/api/user`) unless the existing backend contract is intentionally extended.