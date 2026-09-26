---
name: Calendar date handling
description: Calendar day matching must preserve the user's local date instead of deriving day keys from UTC midnight.
---

Calendar UI comparisons should use local year/month/day components for calendar cells. All-day event values should retain their stored date-only portion, while timed event values should be created as explicit local instants before being sent to the API.

**Why:** Converting a local calendar cell with `toISOString()` can move midnight to the previous UTC date, making an event appear one day later or earlier.

**How to apply:** Keep date-only display keys separate from instant/time calculations. Do not use `toISOString().split("T")[0]` for a user-selected calendar cell.

For PostgreSQL `timestamp` columns, inspect Drizzle's column mapping before attributing a date shift to node-postgres's raw `Date` serialization; Drizzle may first convert the value to a UTC ISO string.

**Why:** The driver boundary can change the timezone behavior, so reasoning from node-postgres alone can lead to an unnecessary API workaround.

**How to apply:** When tracing calendar dates through storage, check both the Drizzle timestamp mode and the value sent to the SQL driver before changing route-level parsing.