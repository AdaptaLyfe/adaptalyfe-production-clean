---
name: Flutter medical mutations
description: The Health Records mobile client must keep mutation refreshes scoped to the collection being changed.
---

Health Records create, edit, and delete actions should update only the affected in-memory collection after the API operation succeeds. Do not make a mutation depend on reloading every medical endpoint.

**Why:** The React wrapper invalidates one query per mutation. A Flutter-wide refresh can fail on an unrelated collection and make a successful write appear to the user as if it failed.

**How to apply:** When adding a Health Records collection or mutation, return the created/updated model or delete id through the BLoC and update that collection locally. Keep unrelated endpoint errors from masking the completed action.