---
name: Adaptalyfe age and tracking policy
description: Product requirements for minimum signup age and iOS tracking prompts.
---

Adaptalyfe accounts are for people age 13 and older; under-13 users may not create accounts or use the service. Keep signup and privacy-policy language aligned across web and native apps.

Request App Tracking Transparency permission only if the app actually tracks users across other companies' apps or websites. Analytics alone is not evidence that ATT is required; re-check SDKs and provider configuration if tracking integrations change.

**Why:** The product owner selected a 13+ minimum age, replacing prior copy that allowed under-13 accounts with parental consent. The code review found no ad SDK or IDFA use to justify the existing ATT prompt.

**How to apply:** Preserve these constraints in React, Flutter, Capacitor iOS, and privacy copy. Revisit the ATT disclosure and consent flow before adding cross-app tracking.