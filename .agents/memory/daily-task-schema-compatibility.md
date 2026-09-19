---
name: Daily task schema compatibility
description: Legacy daily_tasks persistence behavior when deployed schemas lag the shared schema.
---

When choosing a legacy database path from PostgreSQL capability checks, normalize boolean results explicitly. PostgreSQL drivers may return `false` as the string `"f"`, and JavaScript `Boolean("f")` is true.

**Why:** Treating `"f"` as truthy selects modeled columns that do not exist in the legacy table, causing create/read-back failures that surface in the mobile UI as a generic load error.

**How to apply:** Use the shared capability normalizer for every schema flag, and keep legacy inserts explicit when the ORM table definition includes columns absent from the deployed table.