---
name: Flutter settings contract
description: Settings persistence boundaries for the native Flutter client.
---

Native settings must use the authenticated `/api/user-preferences` PUT contract for the five supported JSON columns: notification settings, reminder timing, theme settings, accessibility settings, and behavior patterns. Adaptive personalization controls are nested inside behavior patterns because the active table has no separate adaptive-features column.

**Why:** The repository contains older/demo preference routes and React references to unsupported reset/privacy endpoints; sending unsupported top-level fields can fail or target the wrong user.

**How to apply:** Keep dashboard layout and the web page’s explicitly browser-local preferences in device-local storage. Do not add privacy/reset API calls or invent backend settings until a confirmed route and schema field exist.