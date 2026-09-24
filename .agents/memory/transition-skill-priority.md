---
name: Skill milestone priority persistence
description: Lifecycle rules for Life Skills priority values across the client and backend.
---

Persisted milestone priority is authoritative. Medium is allowed as a default only for a new milestone; reads and edit initialization must never substitute it for a missing saved value. If the database priority column is unavailable, do not silently drop selected priorities or report success.

**Why:** The legacy compatibility path omitted priority writes when the column was unavailable and normalized reads to Medium, making data loss look like a successful save.

**How to apply:** Keep create and edit defaults separate, validate the lowercase priority enum at the API boundary, preserve values through storage and query-cache updates, and surface schema gaps so the database can be synchronized.