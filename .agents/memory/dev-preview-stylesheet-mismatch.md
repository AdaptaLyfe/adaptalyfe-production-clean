---
name: Dev preview stylesheet mismatch
description: Interpreting unstyled Replit dev screenshots when source and build CSS are present.
---

The utility portal's local Replit preview appeared unstyled or stayed on its loading view even though the Vite stylesheet response and production build contained the expected Tailwind utilities. The browser also logged a proxied Vite WebSocket 400. The exact cause was not established.

**Why:** A bare screenshot did not prove that the component classes or production CSS were missing, so adding inline styling or rewriting the page would risk masking a preview-specific issue.

**How to apply:** Before changing component styles to fix an apparently bare dev preview, verify the served CSS and production assets. If the expected rules exist but the preview remains unstyled or loading, report the visual check as inconclusive and avoid unrelated CSS workarounds.