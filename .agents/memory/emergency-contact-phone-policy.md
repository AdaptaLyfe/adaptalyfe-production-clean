---
name: Emergency contact phone policy
description: Why trusted-contact phones require both US formatting and US numbering validity.
---

Emergency contacts must match the requested US input format and pass US numbering metadata checks. Reject numbers the metadata considers invalid, numbers attributed to other countries (including Canadian `+1` numbers), and non-US country codes. This does not prove that a valid-looking number is live or reachable.

**Why:** The user clarified that strict US numbering is preferable to the earlier format-only rule; a ten-digit regex alone cannot establish that a number belongs to the US.

**How to apply:** Keep contact entry and server acceptance consistent. Do not relax the rule back to format-only acceptance or treat every `+1` number as US without confirming a product-policy change.