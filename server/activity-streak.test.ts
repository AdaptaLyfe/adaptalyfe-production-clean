import assert from "node:assert/strict";
import test from "node:test";

import {
  calendarDateWithOffset,
  calculateCurrentStreak,
  normalizedActivityDates,
  shouldIncludeLegacyTaskActivity,
} from "./activity-streak";

test("counts unique consecutive completion days ending today", () => {
  assert.equal(
    calculateCurrentStreak(
      ["2026-09-20", "2026-09-21", "2026-09-21", "2026-09-22", "2026-09-23"],
      "2026-09-23",
    ),
    4,
  );
});

test("stops at the first missing day", () => {
  assert.equal(
    calculateCurrentStreak(
      ["2026-09-20", "2026-09-22", "2026-09-23"],
      "2026-09-23",
    ),
    2,
  );
});

test("returns zero when today has no completion", () => {
  assert.equal(
    calculateCurrentStreak(["2026-09-22", "2026-09-21"], "2026-09-23"),
    0,
  );
});

test("ignores future, malformed, and duplicate dates", () => {
  assert.deepEqual(
    normalizedActivityDates(
      [
        "2026-09-23",
        "2026-09-24",
        "2026-09-23",
        "not-a-date",
        null,
        new Date("invalid"),
      ],
      "2026-09-23",
    ),
    ["2026-09-23"],
  );
});

test("counts only today when there is no earlier completion", () => {
  assert.equal(
    calculateCurrentStreak(["2026-09-23", "2026-09-19"], "2026-09-23"),
    1,
  );
});

test("uses the user's local calendar date when UTC is still on yesterday", () => {
  const utcNow = new Date("2026-09-24T20:00:00.000Z");
  const localToday = calendarDateWithOffset(utcNow, 330);

  assert.equal(localToday, "2026-09-25");
  assert.equal(calculateCurrentStreak(["2026-09-25"], "2026-09-24"), 0);
  assert.equal(
    calculateCurrentStreak(["2026-09-25"], localToday!),
    1,
  );
});

test("rejects invalid timezone offsets", () => {
  const now = new Date("2026-09-24T20:00:00.000Z");

  assert.equal(calendarDateWithOffset(now, 841), null);
  assert.equal(calendarDateWithOffset(now, Number.NaN), null);
  assert.equal(calendarDateWithOffset(new Date("invalid"), 330), null);
});

test("uses date-scoped daily completions instead of stale legacy state", () => {
  assert.equal(shouldIncludeLegacyTaskActivity(true, "daily", true), false);
  assert.equal(shouldIncludeLegacyTaskActivity(true, "daily", false), true);
  assert.equal(shouldIncludeLegacyTaskActivity(true, "weekly", true), true);
  assert.equal(shouldIncludeLegacyTaskActivity(false, "daily", true), true);
});