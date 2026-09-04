---
name: AdaptAI context boundaries
description: Durable rules for assembling personalized AI context safely.
---

AdaptAI context must be built server-side from bounded, user-scoped storage methods and passed to the model only as an explicit allowlisted projection. The authenticated session ID is the sole identity source; caregiver chat does not switch to a linked user's data implicitly. Today Briefing, Next Action, Tasks/Routines, Appointment/Transition, Medication/Health, and Finance modules are deterministic over that projection so ordering, reminder flags, status calculations, safety boundaries, and factual omissions are guaranteed. Medical conditions, allergies, and adverse medication records are loaded only for explicit stored-medical-information requests.

**Why:** The chat route previously accepted a client-supplied user ID and direct database-shaped context would risk cross-user exposure and unnecessary sensitive-data disclosure. Caregiver context adds a second risk: a valid relationship may still have area-specific grants or hidden locks.

**How to apply:** Add new context data through `server/storage.ts` read methods first. For cross-user context, resolve an active `care_relationships` row matching both viewer and subject before loading subject rows; then honor each `caregiver_permissions` grant and deny an area when its existing locked setting hides it. Keep IDs, auth fields, account numbers, payment links, free-form notes, and other nonessential sensitive fields out of the AI projection. Read points balances through a non-mutating method because the legacy balance accessor creates missing rows. Load full bill, budget-entry, and budget-category projections only for finance questions or Today Briefing; derive overdue/due-today/due-soon status from the user's local date. Use deterministic formatters for schedule, next-action, task-status, appointment-transition, medication/health, finance, and caregiver requests; preserve stored dosage/instructions verbatim, treat overdue medication-related tasks as the only missed-reminder evidence, never diagnose or direct medication changes, never mutate records from AI, and reserve the model for open-ended chat.

Personalized communication is presentation-only: derive a normalized profile from explicit allowlisted name, communication, accessibility, detail, and routine settings, then use it for wording, length, structure, and transitions. It must never infer autism, disability, illness, or another clinical trait; deterministic modules may apply the same profile only to formatting, never to factual selection or prioritization.

**Why:** Communication preferences should make the same factual response easier to use without changing what the system knows, decides, or claims about a person.

**How to apply:** Keep neutral defaults for missing settings, reject unknown JSONB strings, sanitize preferred names, and keep restricted caregiver data out of both the profile and the rest of the context.