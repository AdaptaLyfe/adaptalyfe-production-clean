---
name: Web modal stacking
description: Stacking and viewport constraints for hand-built web dialogs
---

When a hand-built overlay must appear above the fixed app navigation, render it at the document body level. Raising its own z-index while leaving it inside page content is not enough.

**Why:** The page content sits in a lower stacking context than the fixed navigation, so descendants cannot outstack the navigation. Tall dialogs also need a viewport limit that leaves room below the header on short screens.

**How to apply:** Prefer the existing portal-bearing dialog primitive for ordinary forms. For custom overlays, portal to the body, use a navigation-clearing layer, and keep header-safe sizing scoped to the affected dialog rather than changing shared modal CSS.