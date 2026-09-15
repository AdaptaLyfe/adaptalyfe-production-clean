import test from "node:test";
import assert from "node:assert/strict";

import {
  getDateStringInTimeZone,
  getSleepDateValidationError,
} from "./sleep-date-validation";

const now = new Date("2026-09-15T23:30:00.000Z");

test("uses the user's local calendar date", () => {
  assert.equal(getDateStringInTimeZone(now, "Asia/Kolkata"), "2026-09-16");
  assert.equal(getDateStringInTimeZone(now, "America/Los_Angeles"), "2026-09-15");
});

test("allows past and current local dates", () => {
  assert.equal(getSleepDateValidationError("2026-09-15", now, "Asia/Kolkata"), null);
  assert.equal(getSleepDateValidationError("2026-09-16", now, "Asia/Kolkata"), null);
  assert.equal(getSleepDateValidationError("2026-09-14", now, "Asia/Kolkata"), null);
});

test("rejects future local dates and malformed dates", () => {
  assert.equal(
    getSleepDateValidationError("2026-09-17", now, "Asia/Kolkata"),
    "Sleep date cannot be in the future",
  );
  assert.equal(
    getSleepDateValidationError("2026-02-30", now, "Asia/Kolkata"),
    "Sleep date must be a valid date",
  );
});