---
name: Flutter analytics
description: Native Firebase Analytics initialization and event contract.
---

The Flutter client initializes Firebase Analytics with explicit Android/iOS `FirebaseOptions` supplied through Dart defines. Analytics is a best-effort app-shell service: route views, lifecycle sessions, user properties, and action events must never block feature or authentication flows.

**Why:** Native Firebase apps do not have the browser's runtime config endpoint, and the mobile workspace does not commit platform config files. Public Firebase client configuration must stay environment-specific without adding server secrets.

**How to apply:** Preserve the established event names and parameter keys in the centralized service. Verify the Dart defines and event delivery on real Android/iOS builds before treating analytics as production-ready.