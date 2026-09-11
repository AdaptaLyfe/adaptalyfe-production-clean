---
name: Flutter dialog provider scope
description: Provider and BLoC access rules for dialogs opened from route-scoped Flutter features.
---

When a feature BLoC is provided inside a route, capture it from the feature screen context before calling showDialog. Use that captured instance inside the dialog submission callbacks instead of calling context.read from the dialog builder or StatefulBuilder context.

**Why:** showDialog creates a separate route/overlay context. Its builder context can sit above the route-scoped provider, causing ProviderNotFoundException only when the user submits the dialog.

**How to apply:** For every add/edit dialog, resolve the BLoC before opening the dialog and dispatch through the captured reference. Apply the same rule to future route-scoped Flutter features.