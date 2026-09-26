---
name: Health Records modal viewport
description: Responsive React web dialogs and mobile keyboard viewport sizing
---

For hand-built Health Records portals, use feature-scoped modal classes and visible-viewport bounds. Leave generic responsive modal rules unchanged because other sections, including Daily Tasks, use them.

**Why:** A visual viewport can shrink or shift when a mobile keyboard opens, while generic modal CSS is shared outside Health Records.

**How to apply:** When changing Health Records popup sizing, include both the medical information forms and Symptom Tracker dialogs, and keep the viewport behavior isolated to their portals.