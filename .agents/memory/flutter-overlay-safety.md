---
name: Flutter overlay safety
description: Preventing duplicate modal routes, navigation races, and competing feature BLoC listeners.
---

Feature overlays must be serialized at their shared entry point, especially when the same dialog or bottom sheet can be opened from multiple widgets. Top-level destinations should use GoRouter replacement navigation rather than stacking pushes, and route-wide purchase state should be owned by one authenticated shell-scoped BLoC.

**Why:** Rapid taps and simultaneous listeners can create multiple modal routes or duplicate feature BLoCs even when every declared GlobalKey is locally unique. Flutter may report the resulting framework overlay conflict as a duplicate GlobalKey during tree finalization.

**How to apply:** Keep local form keys local to each dialog, add an in-flight guard around shared overlay presenters, let GoRouter own auth redirects without parallel screen-level redirects, and share long-lived purchase streams across the authenticated shell.