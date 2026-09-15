import test from "node:test";
import assert from "node:assert/strict";

import {
  formatLocalCalendarDate,
  getCalendarEventDateKey,
  toCalendarDateTimeIso,
} from "./calendar-date";

test("formats a calendar cell using its local date instead of UTC", () => {
  const selectedDate = new Date(2026, 8, 15, 0, 0, 0);

  assert.equal(formatLocalCalendarDate(selectedDate), "2026-09-15");
  assert.equal(getCalendarEventDateKey(selectedDate), "2026-09-15");
});

test("keeps an all-day event on its stored date", () => {
  assert.equal(
    getCalendarEventDateKey("2026-09-15T00:00:00.000Z", true),
    "2026-09-15",
  );
});

test("creates an explicit local event instant from the selected date and time", () => {
  const iso = toCalendarDateTimeIso("2026-09-15", "09:30");
  const parsed = new Date(iso);

  assert.equal(parsed.getHours(), 9);
  assert.equal(parsed.getMinutes(), 30);
  assert.equal(formatLocalCalendarDate(parsed), "2026-09-15");
});