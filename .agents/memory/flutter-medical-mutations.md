---
name: Flutter medical mutations
description: The Health Records mobile client must keep mutation refreshes scoped to the collection being changed.
---

Health Records create, edit, and delete actions should update only the affected in-memory collection after the API operation succeeds. Do not make a mutation depend on reloading every medical endpoint. Initial loads should also isolate collection failures so one protected endpoint does not blank successfully loaded tabs.

**Why:** The React wrapper invalidates one query per mutation and loads collections independently. A Flutter-wide refresh or all-or-nothing initial load can fail on an unrelated collection and make a successful write or available records appear to the user as if they failed.

**How to apply:** When adding a Health Records collection or mutation, return the created/updated model or delete id through the BLoC and update that collection locally. Capture each initial collection request separately, preserve successful results, and show a retryable error only for failed sections.