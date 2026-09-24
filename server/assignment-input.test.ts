import assert from "node:assert/strict";
import test from "node:test";

import {
  AssignmentInputError,
  parseAssignmentEstimatedHours,
  parseAssignmentWriteInput,
} from "./assignment-input";

test("keeps fractional estimated hours numeric", () => {
  assert.equal(parseAssignmentEstimatedHours(2.5), 2.5);
  assert.equal(parseAssignmentEstimatedHours("2.5"), 2.5);
  assert.equal(parseAssignmentEstimatedHours(3.5), 3.5);
});

test("accepts values at the supported estimated-hours boundaries", () => {
  assert.equal(parseAssignmentEstimatedHours(0.01), 0.01);
  assert.equal(parseAssignmentEstimatedHours(100), 100);
});

test("rejects missing, non-finite, zero, negative, and over-limit hours", () => {
  for (const value of [
    undefined,
    null,
    "",
    "not a number",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    0,
    -0.5,
    100.01,
    true,
  ]) {
    assert.throws(() => parseAssignmentEstimatedHours(value), AssignmentInputError);
  }
});

test("validates assignment payloads without rounding decimal hours", () => {
  const input = parseAssignmentWriteInput({
    title: "Read chapter 4",
    description: "",
    type: "homework",
    dueDate: "2026-10-02T16:00:00.000Z",
    priority: "medium",
    classId: null,
    estimatedHours: 2.5,
    userId: 999,
  });

  assert.equal(input.estimatedHours, 2.5);
  assert.equal(typeof input.estimatedHours, "number");
  assert.equal("userId" in input, false);
});