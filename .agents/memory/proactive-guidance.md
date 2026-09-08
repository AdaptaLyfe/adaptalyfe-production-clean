---
name: Proactive guidance safety
description: Durable rules for AdaptAI proactive notifications and their scheduling boundary
---

Proactive guidance should reuse the existing minute-based reminder worker rather than introducing a second scheduler. It must choose one highest-value user-scoped candidate per evaluation, honor explicit notification and quiet-hour settings, and use a stable user/scenario/source/occurrence dedupe key.

**Why:** Repeated polling and multiple simultaneous tasks otherwise create notification floods, while client-supplied or caregiver-targeted data could cross user boundaries.

**How to apply:** Keep decision logic pure and testable; load data only through authenticated user-scoped storage methods, and use an idempotent database insert when surfacing a candidate.