import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidSkillLevelRange,
  skillLevelRangeError,
} from "./skill-level-validation";

test("allows current level equal to or below target level", () => {
  assert.equal(isValidSkillLevelRange(1, 3), true);
  assert.equal(isValidSkillLevelRange(3, 3), true);
});

test("rejects current level above target level", () => {
  assert.equal(isValidSkillLevelRange(4, 3), false);
  assert.equal(skillLevelRangeError, "Current level cannot be greater than target level.");
});