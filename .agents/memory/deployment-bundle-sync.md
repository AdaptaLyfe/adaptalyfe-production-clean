---
name: Deployment bundle synchronization
description: Keep tracked production and static deployment outputs aligned with source during integration changes.
---

When removing an integration, check tracked server bundles, static deployment copies, and HTML files that hard-code hashed asset names. Rebuild supported outputs from current source or confirm they are unreachable; do not rely on source edits alone.

**Why:** Adaptalyfe has multiple alternative deployment outputs and a static app snapshot that can retain old integration code after its source route is removed.

**How to apply:** Search deployment build/start configuration and references to generated filenames. Refresh the supported outputs and their asset references, while preserving legacy database mappings when historical data still depends on them.