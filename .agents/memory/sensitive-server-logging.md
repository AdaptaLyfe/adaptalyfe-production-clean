---
name: Sensitive server logging
description: Prevent sensitive user content from being retained in application and hosting logs.
---

Never serialize API response bodies, AI answers, health-record request bodies, or saved health records into server logs. Keep request logs limited to operational metadata such as method, route, status, and duration; error logs should avoid serializing user data or provider/database error payloads that may contain it.

**Why:** AdaptAI answers and health records can contain sensitive personal information, and stdout is commonly collected and retained separately by hosting providers.

**How to apply:** When adding or changing middleware and route logging, inspect both development and production entry points. Log only what is needed to diagnose service health, and treat existing log retention/deletion as a separate hosting-platform concern.
