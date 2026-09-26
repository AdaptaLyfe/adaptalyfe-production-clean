import assert from "node:assert/strict";
import test from "node:test";

import {
  AssignmentInputError,
  parseAssignmentEstimatedHours,
  parseAssignmentWriteInput,
} from "./assignment-input";

test("keeps whole and fractional estimated hours numeric", () => {
  for (const value of [0.5, 1, 1.5, 2, 2.5, 3.75, 10.5, 10.75]) {
    assert.equal(parseAssignmentEstimatedHours(value), value);
    assert.equal(typeof parseAssignmentEstimatedHours(value), "number");
  }
  for (const value of ["0.5", "2.5", "10.75"]) {
    assert.equal(parseAssignmentEstimatedHours(value), Number(value));
  }
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
  for (const estimatedHours of [2, 2.5, 0.5, 10.75]) {
    const input = parseAssignmentWriteInput({
      title: "Read chapter 4",
      description: "",
      type: "homework",
      dueDate: "2026-10-02T16:00:00.000Z",
      priority: "medium",
      classId: null,
      estimatedHours,
      userId: 999,
    });

    assert.equal(input.estimatedHours, estimatedHours);
    assert.equal(typeof input.estimatedHours, "number");
    assert.equal("userId" in input, false);
  }
});