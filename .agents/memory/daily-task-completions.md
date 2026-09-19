---
name: Daily task completion dates
description: Recurring daily task definitions need separate completion instances keyed by task and calendar date.
---

For recurring daily tasks, the task definition describes what repeats; completion state belongs to a separate record keyed by task and date. A daily recurrence begins on its server-managed creation date. A legacy global completion field may be retained for compatibility but must not determine past or future calendar-day status once date-scoped records exist.

**Why:** A single `isCompleted` flag on a recurring task is shared by every occurrence, so completing one day incorrectly marks every day complete; without a creation date, Calendar also cannot distinguish valid recurrence dates from dates before the task existed.

**How to apply:** Read recurring-task status against the requested local calendar date, return the available completion dates to calendar views, start daily occurrences at the task creation date, and write/unwrite only the selected date’s completion record.

For Flutter’s implicit “today” task view, derive the local calendar date for each load, refresh, and completion request; only an explicitly selected historical/future date should remain fixed in BLoC state.

**Why:** A screen can remain mounted across midnight, and retaining the opening timestamp makes later reads and toggles target yesterday’s completion record.

**How to apply:** Start the normal Daily Tasks route without a fixed date, keep explicit date selection separate, and refresh the Home task BLoC when returning from the full task screen.

Daily Task mutations should use the successful create/update/delete response to keep the local list current, with a refresh treated as reconciliation rather than the only way to display a committed change.

**Why:** A successful mutation followed by a transient GET failure must not make a saved task appear to have been lost.

**How to apply:** Preserve the mutation result as a fallback when the post-mutation list refresh fails, while still retrying or allowing a later pull-to-refresh.