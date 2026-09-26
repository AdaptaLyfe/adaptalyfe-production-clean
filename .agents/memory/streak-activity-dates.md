---
name: Streak activity date semantics
description: Distinguish date-only records from timestamps when calculating activity streaks.
---

Treat persisted date-only fields as already calendar-scoped; do not shift them through UTC or a timezone offset. Timestamp activity records represent instants and must be normalized in the same user timezone used to determine today.

**Why:** Streak sources mix date keys with timestamps. Treating all values as UTC can move early or late local-day activity onto the adjacent calendar day.

**How to apply:** A completed meal plan currently qualifies on its saved `plannedDate` because the schema has no separate completion timestamp. If the product should count the actual toggle day, persist that date explicitly rather than infer it from `isCompleted`. Quick Action navigation alone is not a completion.

The dashboard-facing `users.streakDays` value is primary; refreshing it must not depend on the supplemental `streak_tracking` history write succeeding.

**Why:** Streak refresh runs after activity and when loading the dashboard. A lagging history-table schema should not keep the visible counter stale.

**How to apply:** Persist the computed user streak first, then update history as best-effort and log failures.