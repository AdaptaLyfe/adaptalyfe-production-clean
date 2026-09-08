---
name: Post-merge database setup
description: Non-interactive post-merge behavior for the workspace database package.
---

The post-merge runner has no TTY. Drizzle Kit table-rename resolution can still prompt with `push --force`, so automatic post-merge database pushes are unsafe; keep post-merge setup limited to deterministic dependency installation unless an explicit non-interactive migration path is introduced.

**Why:** The workspace database contains schema/table differences that trigger Drizzle's interactive resolver before its force approval behavior, causing setup errors in the headless runner.

**How to apply:** When changing post-merge setup, preserve a generous timeout for the workspace install and do not reintroduce an unattended `drizzle-kit push` command without first adding a migration flow that cannot prompt.