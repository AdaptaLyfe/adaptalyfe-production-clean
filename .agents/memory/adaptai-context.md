---
name: AdaptAI context boundaries
description: Durable rules for assembling personalized AI context safely.
---

AdaptAI context must be built server-side from bounded, user-scoped storage methods and passed to the model only as an explicit allowlisted projection. The authenticated session ID is the sole identity source; caregiver chat does not switch to a linked user's data implicitly. Today Briefing, Next Action, Tasks/Routines, Appointment/Transition, and Medication/Health modules are deterministic over that projection so ordering, reminder flags, status calculations, safety boundaries, and factual omissions are guaranteed. Medical conditions, allergies, and adverse medication records are loaded only for explicit stored-medical-information requests.

**Why:** The chat route previously accepted a client-supplied user ID and direct database-shaped context would risk cross-user exposure and unnecessary sensitive-data disclosure.

**How to apply:** Add new context data through `server/storage.ts` read methods first. Keep IDs, auth fields, account numbers, payment links, free-form notes, and other nonessential sensitive fields out of the AI projection. Read points balances through a non-mutating method because the legacy balance accessor creates missing rows. Use deterministic formatters for schedule, next-action, task-status, appointment-transition, and medication/health requests; preserve stored dosage/instructions verbatim, treat overdue medication-related tasks as the only missed-reminder evidence, never diagnose or direct medication changes, never mutate records from AI, and reserve the model for open-ended chat.