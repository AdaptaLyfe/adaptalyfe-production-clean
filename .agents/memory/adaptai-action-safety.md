---
name: AdaptAI action safety
description: The safety boundary for future AdaptAI write capabilities
---

AdaptAI write capabilities must be exposed as a small allowlisted action registry, never as arbitrary database or storage access. Every action request is schema-validated, scoped to the authenticated user, checked against ownership and existing business rules, and confirmed before execution. Completion actions must use an atomic owned-and-incomplete storage update so concurrent confirmations cannot award points twice.

**Why:** Natural-language model output is untrusted and can be ambiguous. Keeping proposal, confirmation, validation, and execution separate prevents prompt output from bypassing permissions or mutating sensitive domains.

**How to apply:** Add future capabilities as explicit action names with dedicated Zod parameter schemas and handlers. Do not add generic table names, SQL, storage method names, or client-supplied target-user identifiers to the action contract. For state transitions, make the storage predicate enforce both ownership and the prior state; award side effects only after the transition succeeds.