import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCurrentStreak,
  normalizedActivityDates,
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