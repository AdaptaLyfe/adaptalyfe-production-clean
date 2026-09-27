---
name: US contact phone policy
description: User-approved US numbering policy for saved health and emergency phone fields.
---

Phone numbers on emergency contacts, healthcare contacts, and local emergency resources must match the accepted US input format and pass US numbering metadata checks. Local emergency resource phone numbers remain optional, but if provided they must be valid. Reject numbers the metadata considers invalid, numbers attributed to other countries (including Canadian `+1` numbers), and non-US country codes. This does not prove that a valid-looking number is live or reachable.

**Why:** The user explicitly requested US-only validation for contact and resource phone numbers; a ten-digit regex alone cannot establish that a number belongs to the US, and `+1` also covers Canada.

**How to apply:** Keep client form checks and server acceptance consistent, preserve optional blank resource numbers, and do not relax validation to format-only acceptance without confirming a product-policy change.