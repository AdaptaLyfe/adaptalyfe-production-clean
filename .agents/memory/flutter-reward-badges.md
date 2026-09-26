---
name: Flutter reward badges
description: Failure and empty-state behavior for badges within the Rewards feature.
---

Reward badges load alongside rewards, points, and transactions, but ordinary badge API or parsing failures must not fail the entire Rewards load. Unauthorized responses still use the session-invalid flow, and a successful empty list is an empty state rather than an error.

**Why:** Coupling the badge request to the full Rewards load let an auxiliary endpoint outage hide unrelated rewards data, while an empty response was previously rendered as a load failure.

**How to apply:** Keep badge request errors separate from global Rewards errors, preserve other loaded content, and apply the same isolation to post-redemption refreshes.