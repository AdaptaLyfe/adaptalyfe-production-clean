---
name: Academic Planner mutations
description: Mutation state updates and provider scope rules for the Flutter Academic Planner.
---

For Academic Planner creates, update the affected collection from the successful mutation response and deduplicate by server ID. Do not make the user-visible mutation depend on reloading unrelated Academic Planner endpoints.

**Why:** A full parallel reload can fail in an unrelated collection after the create has already succeeded, leaving the newly created class absent from the current screen.

**How to apply:** Keep route-scoped `AcademicBloc` access by capturing the bloc before opening dialogs. Inside dialog or `StatefulBuilder` contexts, use that captured instance rather than looking up the provider again.