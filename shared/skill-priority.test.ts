import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeTransitionSkillPriority,
  parseNewTransitionSkillPriority,
  transitionSkillPrioritySchema,
} from "./skill-priority";

test("preserves each supported saved priority", () => {
  assert.equal(normalizeTransitionSkillPriority("low"), "low");
  assert.equal(normalizeTransitionSkillPriority("medium"), "medium");
  assert.equal(normalizeTransitionSkillPriority("high"), "high");
  assert.equal(normalizeTransitionSkillPriority("critical"), "critical");
});

test("normalizes legacy casing without applying a medium fallback", () => {
  assert.equal(normalizeTransitionSkillPriority(" High "), "high");
  assert.equal(normalizeTransitionSkillPriority(null), null);
  assert.equal(normalizeTransitionSkillPriority(undefined), null);
  assert.equal(normalizeTransitionSkillPriority(""), null);
  assert.equal(normalizeTransitionSkillPriority("urgent"), null);
});

test("validates API priorities and defaults only new milestones", () => {
  for (const priority of ["low", "medium", "high", "critical"] as const) {
    assert.equal(transitionSkillPrioritySchema.parse(priority), priority);
    assert.equal(parseNewTransitionSkillPriority(priority), priority);
  }

  assert.equal(parseNewTransitionSkillPriority(undefined), "medium");
  assert.throws(() => transitionSkillPrioritySchema.parse("urgent"));
  assert.throws(() => parseNewTransitionSkillPriority("urgent"));
});