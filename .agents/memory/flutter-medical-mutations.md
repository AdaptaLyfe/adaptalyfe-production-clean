---
name: Flutter medical mutations
description: The Health Records mobile client must keep mutation refreshes scoped to the collection being changed.
---

Health Records create, edit, and delete actions should update only the affected in-memory collection after the API operation succeeds. Do not make a mutation depend on reloading every medical endpoint. Initial loads should also isolate collection failures so one protected endpoint does not blank successfully loaded tabs.

**Why:** The React wrapper invalidates one query per mutation and loads collections independently. A Flutter-wide refresh or all-or-nothing initial load can fail on an unrelated collection and make a successful write or available records appear to the user as if they failed.

**How to apply:** When adding a Health Records collection or mutation, return the created/updated model or delete id through the BLoC and update that collection locally. Capture each initial collection request separately, preserve successful results, and show a retryable error only for failed sections. Update payloads must include explicit nulls for cleared nullable fields; omission leaves the old database value intact.

Edit forms must normalize persisted enum-like values before passing them to Flutter dropdowns, and clamp persisted dates before using them as date-picker initial values.

**Why:** Older or manually edited records can contain values outside the current option lists or dates outside picker bounds; Flutter asserts during widget construction instead of rendering a recoverable validation error.

**How to apply:** Apply the normalization at dialog initialization for every Health Records collection, including sensitivities, conditions, reactions, and symptom severity.

Success listeners for Health Records dialogs should close after the submit-button animation settles and avoid rebuilding the button during the same success transition.

**Why:** Removing the dialog while Material's enabled/disabled text-style animation is still active can leave a dirty widget in the wrong Flutter build scope.

**How to apply:** Let the listener handle navigation as its side effect with a short guarded delay; only rebuild the dialog while submitting or when an operation fails and the form must be re-enabled.