---
name: Flutter settings contract
description: Settings persistence boundaries for the native Flutter client.
---

Native settings must use the authenticated `/api/user-preferences` PUT contract for the five supported JSON columns: notification settings, reminder timing, theme settings, accessibility settings, and behavior patterns. Adaptive personalization controls are nested inside behavior patterns because the active table has no separate adaptive-features column.

**Why:** The repository contains older/demo preference routes and React references to unsupported reset/privacy endpoints; sending unsupported top-level fields can fail or target the wrong user.

**How to apply:** Keep dashboard layout and the web page’s explicitly browser-local preferences in device-local storage. Do not add privacy/reset API calls or invent backend settings until a confirmed route and schema field exist.

Flutter Privacy Mode is a device-local visual blur for explicitly marked sensitive values. Describe it as visual masking only; it does not block screenshots or change server-side access or sharing.

**Why:** The current Flutter implementation has no platform screenshot-prevention mechanism, and overstating what the toggle protects would mislead users.

**How to apply:** Keep privacy mode separate from data deletion/sharing controls, wrap sensitive display values, and keep the Settings copy aligned with the actual visual behavior.