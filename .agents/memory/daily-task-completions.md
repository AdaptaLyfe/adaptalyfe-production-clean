---
name: Daily task completion dates
description: Recurring daily task definitions need separate completion instances keyed by task and calendar date.
---

For recurring daily tasks, the task definition describes what repeats; completion state belongs to a separate record keyed by task and date. A daily recurrence begins on its server-managed creation date. A legacy global completion field may be retained for compatibility but must not determine past or future calendar-day status once date-scoped records exist.

**Why:** A single `isCompleted` flag on a recurring task is shared by every occurrence, so completing one day incorrectly marks every day complete; without a creation date, Calendar also cannot distinguish valid recurrence dates from dates before the task existed.

**How to apply:** Read recurring-task status against the requested local calendar date, return the available completion dates to calendar views, start daily occurrences at the task creation date, and write/unwrite only the selected date’s completion record.