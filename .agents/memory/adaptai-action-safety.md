---
name: AdaptAI action safety
description: The safety boundary for future AdaptAI write capabilities
---

AdaptAI write capabilities must be exposed as a small allowlisted action registry, never as arbitrary database or storage access. Every action request is schema-validated, scoped to the authenticated user, checked against ownership and existing business rules, and confirmed before execution.

**Why:** Natural-language model output is untrusted and can be ambiguous. Keeping proposal, confirmation, validation, and execution separate prevents prompt output from bypassing permissions or mutating sensitive domains.

**How to apply:** Add future capabilities as explicit action names with dedicated Zod parameter schemas and handlers. Do not add generic table names, SQL, storage method names, or client-supplied target-user identifiers to the action contract.