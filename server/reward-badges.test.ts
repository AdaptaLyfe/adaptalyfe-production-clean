import assert from "node:assert/strict";
import test from "node:test";

import {
  countCompletedSkillMilestones,
  countCompletedMilestones,
  evaluateRewardBadges,
  newlyEarnedRewardBadges,
  resolveLifetimeEarned,
} from "./reward-badges";

test("keeps badges locked until their requirements are met", () => {
  const badges = evaluateRewardBadges({
    lifetimeEarned: 0,
    rewardsRedeemed: 0,
    completedMilestones: 0,
  });

  assert.equal(badges.every((badge) => !badge.isEarned), true);
  assert.deepEqual(
    badges.map((badge) => [badge.type, badge.progress, badge.target]),
    [
      ["first_reward", 0, 1],
      ["reward_collector", 0, 5],
      ["point_starter", 0, 100],
      ["point_master", 0, 500],
      ["milestone_achiever", 0, 1],
    ],
  );
});

test("evaluates points, redemptions, and milestones independently", () => {
  const badges = evaluateRewardBadges({
    lifetimeEarned: 500,
    rewardsRedeemed: 3,
    completedMilestones: 1,
  });

  assert.deepEqual(
    badges.filter((badge) => badge.isEarned).map((badge) => badge.type),
    ["first_reward", "point_starter", "point_master", "milestone_achiever"],
  );
  assert.equal(badges.find((badge) => badge.type === "reward_collector")?.progress, 3);
});

test("counts only explicitly completed milestone records", () => {
  assert.equal(
    countCompletedMilestones([
      { isCompleted: true },
      { isCompleted: false },
      { title: "Not completed" },
      "legacy milestone",
      null,
    ]),
    1,
  );
});

test("uses historical point transactions when the cached balance is missing or stale", () => {
  assert.equal(resolveLifetimeEarned(undefined, "500"), 500);
  assert.equal(resolveLifetimeEarned(125, 500), 500);
  assert.equal(resolveLifetimeEarned(700, 500), 700);
  assert.equal(resolveLifetimeEarned(-10, null), 0);

  const badges = evaluateRewardBadges({
    lifetimeEarned: resolveLifetimeEarned(undefined, 500),
    rewardsRedeemed: 0,
    completedMilestones: 0,
  });
  assert.deepEqual(
    badges.filter((badge) => badge.isEarned).map((badge) => badge.type),
    ["point_starter", "point_master"],
  );
});

test("counts completed skill goals and explicit historical milestone records", () => {
  assert.equal(
    countCompletedSkillMilestones([
      { currentLevel: 5, targetLevel: 5, milestones: [] },
      {
        currentLevel: 3,
        targetLevel: 5,
        milestones: [{ isCompleted: true }, { isCompleted: false }],
      },
      {
        currentLevel: 5,
        targetLevel: 5,
        milestones: [{ isCompleted: true }, { isCompleted: true }],
      },
      { currentLevel: 3, targetLevel: 5, milestones: [] },
      { currentLevel: null, targetLevel: 5, milestones: null },
      null,
    ]),
    4,
  );
});

test("does not propose duplicate awards for stored or repeated badge keys", () => {
  const evaluations = evaluateRewardBadges({
    lifetimeEarned: 500,
    rewardsRedeemed: 5,
    completedMilestones: 1,
  });
  const awards = newlyEarnedRewardBadges(
    [...evaluations, ...evaluations],
    new Set(["first_reward"]),
  );

  assert.deepEqual(
    awards.map((badge) => badge.type),
    ["reward_collector", "point_starter", "point_master", "milestone_achiever"],
  );
});