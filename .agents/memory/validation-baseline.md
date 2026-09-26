---
name: Validation baseline
description: What validation signals are reliable for focused frontend changes in this repository.
---

The full TypeScript check is not currently a clean project-wide gate because unrelated legacy files contain syntax and type errors. A focused diagnostic for the changed area, the production build, and runtime workflow logs are the reliable checks for localized frontend work.

**Why:** A report fix can be valid and ship successfully even when a repository-wide type check fails elsewhere; treating the baseline failures as regressions causes unnecessary scope expansion.

**How to apply:** For localized UI changes, run the production build and filter type-check output to the changed file. Report unrelated baseline failures separately instead of modifying legacy files outside the requested scope.