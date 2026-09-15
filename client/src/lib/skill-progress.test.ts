import test from "node:test";
import assert from "node:assert/strict";
import { getSkillProgressState } from "./skill-progress";

test("a newly created Level 1 milestone is counted as in progress", () => {
  const state = getSkillProgressState(1, 5);

  assert.equal(state.percentage, 20);
  assert.equal(state.isInProgress, true);
  assert.equal(state.isCompleted, false);
});

test("an updated milestone remains in progress until it reaches its target", () => {
  assert.equal(getSkillProgressState(2, 5).isInProgress, true);
  assert.equal(getSkillProgressState(4, 5).isInProgress, true);
});

test("a milestone at or above its target is completed, not in progress", () => {
  assert.equal(getSkillProgressState(5, 5).isInProgress, false);
  assert.equal(getSkillProgressState(5, 5).isCompleted, true);
  assert.equal(getSkillProgressState(6, 5).isInProgress, false);
});