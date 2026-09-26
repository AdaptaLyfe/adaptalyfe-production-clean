import assert from "node:assert/strict";
import test from "node:test";
import type {
  AdaptAIContext,
  AiAchievement,
  AiGoal,
  AiReward,
  AiSkill,
  AiTask,
} from "./ai-context.js";
import {
  buildGoalsProgressRewardsResponse,
  isGoalsProgressRewardsRequest,
} from "./goals-progress-rewards.js";

const task = (overrides: Partial<AiTask>): AiTask => ({
  title: "Task",
  category: "general",
  isCompleted: false,
  frequency: "once",
  estimatedMinutes: 10,
  ...overrides,
});

const goal = (overrides: Partial<AiGoal>): AiGoal => ({
  title: "Goal",
  category: "other",
  priority: "medium",
  isDueToday: false,
  isCompleted: false,
  ...overrides,
});

const skill = (overrides: Partial<AiSkill>): AiSkill => ({
  skillCategory: "independent_living",
  skillName: "Skill",
  currentLevel: 1,
  targetLevel: 5,
  milestones: [],
  ...overrides,
});

const achievement = (overrides: Partial<AiAchievement>): AiAchievement => ({
  title: "Achievement",
  category: "daily_tasks",
  points: 10,
  ...overrides,
});

const reward = (overrides: Partial<AiReward>): AiReward => ({
  title: "Reward",
  category: "activity",
  pointsRequired: 20,
  ...overrides,
});

const context = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Alex" },
  today: { date: "2026-09-03", time: "15:00", timezone: "Asia/Calcutta" },
  ...overrides,
});

test("recognizes goals, progress, accomplishment, improvement, and next-work questions", () => {
  for (const request of [
    "How am I doing?",
    "What progress have I made?",
    "What did I accomplish?",
    "Am I getting better at this?",
    "What should I work on next?",
  ]) {
    assert.equal(isGoalsProgressRewardsRequest(request), true, request);
  }
});

test("handles no progress data without inventing accomplishments", () => {
  const response = buildGoalsProgressRewardsResponse("How am I doing?", context());
  assert.equal(
    response,
    "I don't have recorded goals, completed milestones, achievements, rewards, or task progress to summarize yet. You can start with one small step whenever you're ready."
  );
});

test("reports partial task progress with encouraging language", () => {
  const tasks = [
    task({ title: "Finished one", isCompleted: true }),
    task({ title: "Finished two", isCompleted: true }),
    task({ title: "Finished three", isCompleted: true }),
    task({ title: "Finished four", isCompleted: true }),
    task({ title: "Remaining one" }),
    task({ title: "Remaining two" }),
  ];
  const response = buildGoalsProgressRewardsResponse(
    "How am I doing?",
    context({
      tasks: {
        today: tasks,
        completed: tasks.filter((item) => item.isCompleted),
        incomplete: tasks.filter((item) => !item.isCompleted),
      },
    })
  );

  assert.match(response, /You completed 4 of your 6 planned tasks today/);
  assert.doesNotMatch(response, /failed|lazy|bad|should have/i);
});

test("reports completed goals as recorded accomplishments", () => {
  const response = buildGoalsProgressRewardsResponse(
    "What did I accomplish?",
    context({
      goals: [goal({ title: "Save for a bike", isCompleted: true, currentAmount: 300, targetAmount: 300 })],
    })
  );

  assert.match(response, /completed the goal 'Save for a bike'/i);
  assert.doesNotMatch(response, /almost|failed|behind/i);
});

test("reports achievements and completed milestones without claiming an unrecorded trend", () => {
  const response = buildGoalsProgressRewardsResponse(
    "Am I getting better at this?",
    context({
      progress: {
        skills: [
          skill({
            skillName: "Cooking",
            currentLevel: 3,
            targetLevel: 5,
            milestones: [
              { title: "Made breakfast", isCompleted: true },
              { title: "Planned a meal", isCompleted: false },
            ],
          }),
        ],
        recentAchievements: [achievement({ title: "Three-day task streak" })],
      },
    })
  );

  assert.match(response, /Cooking \(level 3 of 5, 1 of 2 milestones completed\)/);
  assert.match(response, /Three-day task streak/);
  assert.doesNotMatch(response, /you are getting better|improved|improvement/i);
});

test("summarizes multiple goals and active rewards", () => {
  const response = buildGoalsProgressRewardsResponse(
    "What progress have I made?",
    context({
      goals: [
        goal({ title: "Save for a bike", currentAmount: 50, targetAmount: 100 }),
        goal({ title: "Build a morning routine", currentAmount: 2, targetAmount: 5 }),
      ],
      progress: {
        recentRewards: [reward({ title: "Movie night" }), reward({ title: "Pizza night" })],
        points: { availablePoints: 30, lifetimeEarned: 50, lifetimeSpent: 20 },
      },
    })
  );

  assert.match(response, /You have 2 active goals/);
  assert.match(response, /Save for a bike/);
  assert.match(response, /Build a morning routine/);
  assert.match(response, /2 active rewards are recorded/);
});

test("suggests the next recorded goal without creating a new goal or reward", () => {
  const response = buildGoalsProgressRewardsResponse(
    "What should I work on next?",
    context({
      goals: [goal({ title: "Practice budgeting", currentAmount: 1, targetAmount: 3 })],
    })
  );

  assert.equal(
    response,
    "A recorded goal to keep working on is Practice budgeting (active (1 of 3 recorded, 33%))."
  );
});