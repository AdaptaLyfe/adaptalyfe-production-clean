---
name: Flutter Features catalog
description: Expected behavior of the Flutter app's Features drawer entry.
---

The Flutter Features drawer item should open a catalog matching the React/Capacitor `/features` page. The catalog is informational; feature cards are not shortcuts to module routes. Do not change this to direct feature navigation unless product requirements change.

**Why:** The product owner chose parity with the wrapper's existing informational catalog instead of adding navigation behavior that the wrapper does not provide.

**How to apply:** Keep the Flutter catalog route, plan filters, feature IDs, titles, statuses, and descriptions aligned with `client/src/pages/features.tsx`. Existing feature modules remain accessible through current navigation.