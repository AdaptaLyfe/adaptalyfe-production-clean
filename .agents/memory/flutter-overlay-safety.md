---
name: Flutter overlay safety
description: Preventing duplicate modal routes, navigation races, and competing feature BLoC listeners.
---

Feature overlays must be serialized at their shared entry point, especially when the same dialog or bottom sheet can be opened from multiple widgets. Top-level destinations should use GoRouter replacement navigation rather than stacking pushes, and route-wide purchase state should be owned by one authenticated shell-scoped BLoC.

**Why:** Rapid taps and simultaneous listeners can create multiple modal routes or duplicate feature BLoCs even when every declared GlobalKey is locally unique. Flutter may report the resulting framework overlay conflict as a duplicate GlobalKey during tree finalization.

**How to apply:** Keep local form keys local to each dialog, add an in-flight guard around shared overlay presenters, let GoRouter own auth redirects without parallel screen-level redirects, and share long-lived purchase streams across the authenticated shell.

Dialog form controllers must be owned by the dialog's `State` and disposed from `dispose()`. Never create them in the presenter function and dispose them in the `showDialog` completion path while a BLoC-driven rebuild or async mutation can still reference the form.

**Why:** Disposing function-scoped controllers in `finally` can race the dialog's rebuild and cause both "controller used after dispose" and wrong-build-scope framework assertions.

**How to apply:** Use a dedicated `StatefulWidget` for stateful forms, keep BLoC listeners and builders inside that widget, and close the route only from a successful state transition.