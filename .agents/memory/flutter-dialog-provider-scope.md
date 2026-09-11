---
name: Flutter dialog provider scope
description: Provider and BLoC access rules for dialogs opened from route-scoped Flutter features.
---

When a feature BLoC is provided inside a route, capture it from the feature screen context before calling showDialog. Use that captured instance inside the dialog submission callbacks instead of calling context.read from the dialog builder or StatefulBuilder context. Keep the dialog open while the mutation is pending and close it from a success-state listener, rather than dispatching the mutation and popping the dialog in the same callback.

**Why:** showDialog creates a separate route/overlay context. Its builder context can sit above the route-scoped provider, causing ProviderNotFoundException only when the user submits the dialog. Dispatching a BLoC state change and tearing down an animated dialog in one callback can also trigger Flutter's "dirty widget in the wrong build scope" assertion.

**How to apply:** For every add/edit dialog, resolve the BLoC before opening the dialog, provide the captured BLoC to the dialog, disable submit while its action section is busy, and close after the matching success message. Leave the dialog open on failure so the user can retry.