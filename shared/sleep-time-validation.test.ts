import test from "node:test";
import assert from "node:assert/strict";

import { getSleepTimeValidationError } from "./sleep-time-validation";

test("allows equal and later 24-hour times", () => {
  assert.equal(getSleepTimeValidationError("22:00", "22:00"), null);
  assert.equal(getSleepTimeValidationError("22:00", "22:30"), null);
});

test("rejects an earlier 24-hour sleep time", () => {
  assert.equal(
    getSleepTimeValidationError("22:00", "21:30"),
    "Time fell asleep must be the same as or later than bedtime",
  );
});

test("handles 12-hour AM/PM values", () => {
  assert.equal(getSleepTimeValidationError("10:00 PM", "10:30 PM"), null);
  assert.equal(getSleepTimeValidationError("10:00 PM", "9:30 PM"), "Time fell asleep must be the same as or later than bedtime");
  assert.equal(getSleepTimeValidationError("11:00 AM", "12:00 PM"), null);
});

test("compares ISO timestamps and rejects malformed values", () => {
  assert.equal(
    getSleepTimeValidationError(
      "2026-09-15T22:00:00.000Z",
      "2026-09-15T22:30:00.000Z",
    ),
    null,
  );
  assert.equal(
    getSleepTimeValidationError(
      "2026-09-15T22:00:00.000Z",
      "2026-09-15T21:30:00.000Z",
    ),
    "Time fell asleep must be the same as or later than bedtime",
  );
  assert.equal(
    getSleepTimeValidationError("not-a-time", "22:00"),
    "Bedtime and time fell asleep must be valid times",
  );
});