---
name: AdaptAI context boundaries
description: Durable rules for assembling personalized AI context safely.
---

AdaptAI context must be built server-side from bounded, user-scoped storage methods and passed to the model only as an explicit allowlisted projection. The authenticated session ID is the sole identity source; caregiver chat does not switch to a linked user's data implicitly. The Today Briefing is deterministic over that projection so ordering and factual omissions are guaranteed.

**Why:** The chat route previously accepted a client-supplied user ID and direct database-shaped context would risk cross-user exposure and unnecessary sensitive-data disclosure.

**How to apply:** Add new context data through `server/storage.ts` read methods first. Keep IDs, auth fields, account numbers, payment links, free-form notes, and other nonessential sensitive fields out of the AI projection. Read points balances through a non-mutating method because the legacy balance accessor creates missing rows. Use the briefing formatter for schedule-style requests and reserve the model for open-ended chat.