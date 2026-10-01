---
name: Reward archiving
description: Data-retention and availability semantics when a reward is removed.
---

Removing a reward must archive it by setting `isActive` to false, not delete its row. Archived rewards should disappear from available rewards and must not be redeemable, while existing redemption and points history stays attached to the same reward.

**Why:** Redemption records have a foreign-key relationship to rewards, and deleting the reward would break historical accounting. The product behavior is to keep that history while stopping future claims.

**How to apply:** Keep the delete API compatible but implement a soft delete; filter inactive rewards from availability queries and reject stale redemption requests before points are reserved. Any restore flow should reactivate the same reward row rather than recreate or rewrite its history.