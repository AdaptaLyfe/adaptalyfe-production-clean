---
name: Reward redemption limits
description: Business semantics for enforcing caregiver-configured reward redemption caps.
---
Finite reward limits count pending, approved, and completed redemptions for the logged-in user and specific reward. Denied records do not count, and a null maximum remains unlimited.

**Why:** A pending redemption already consumes the user's points and waits for caregiver approval, so excluding it would allow repeated requests to bypass the configured cap.

**How to apply:** Enforce the limit inside the same database transaction that reserves the redemption and deducts points; keep client-side checks as feedback only.