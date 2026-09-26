---
name: Flutter Home customization
description: Home quick actions and dashboard modules mirror the React local customization flows while persisting through SharedPreferences.
---

Quick Actions use separate direct reorder mode and Customize mode: reorder changes the visible-item order immediately, while Customize edits temporary visibility state and only commits on Save Changes; Close rolls back.

Dashboard customization keeps active modules, hidden basic modules, and premium modules as separate UI sections, auto-saves each switch/order/reset change, and normalizes module order before persistence.

**Why:** The React reference treats layout preferences as device-local state and applies ordering to enabled/visible items rather than hidden items.

**How to apply:** Keep `ApiClient` and backend routes out of these preferences; update the default metadata and normalization whenever a new module or quick action is added.

The former device-global dashboard value has no account owner. Migrate it once to the first authenticated user that loads or saves the layout, then retire the global key; never copy it into every account’s preferences.

**Why:** The old value cannot be attributed reliably, so a one-time assignment preserves existing settings without continuing to share them across accounts.

**How to apply:** When scoping other legacy local preferences by user, use a one-time migration marker and do not infer an owner the old data never stored.