import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiTask } from "./ai-context.js";
import {
  buildTasksRoutinesResponse,
  calculateTaskProgress,
  isTasksRoutinesRequest,
} from "./tasks-routines.js";

const task = (overrides: Partial<AiTask>): AiTask => ({
  title: "Task",
  category: "general",
  isCompleted: false,
  frequency: "once",
  estimatedMinutes: 10,
  ...overrides,
});

const context = (tasks: AiTask[], time = "10:00"): AdaptAIContext => ({
  identity: { displayName: "Niraj" },
  today: { date: "2026-09-03", time, timezone: "Asia/Calcutta" },
  tasks: {
    today: tasks,
    incomplete: tasks.filter((item) => !item.isCompleted),
    completed: tasks.filter((item) => item.isCompleted),
  },
});

test("recognizes task, routine, and daily progress questions", () => {
  const requests = [
    "What tasks do I have left?",
    "What have I finished?",
    "Did I complete my routine?",
    "Help me with my routine.",
    "What am I missing?",
    "How am I doing today?",
  ];

  for (const request of requests) {
    assert.equal(isTasksRoutinesRequest(request), true, request);
  }
});

test("calculates completed, incomplete, overdue, scheduled, and upcoming status", () => {
  const progress = calculateTaskProgress(
    context([
      task({ title: "Finished task", isCompleted: true, scheduledTime: "08:00" }),
      task({ title: "Overdue task", dueDate: "2026-09-02", scheduledTime: "09:00" }),
      task({ title: "Upcoming task", scheduledTime: "11:00" }),
      task({ title: "Unscheduled task" }),
    ])
  );

  assert.equal(progress.total, 4);
  assert.equal(progress.completed, 1);
  assert.equal(progress.incomplete, 3);
  assert.deepEqual(progress.overdue.map((item) => item.title), ["Overdue task"]);
  assert.deepEqual(progress.scheduled.map((item) => item.title), [
    "Finished task",
    "Overdue task",
    "Upcoming task",
  ]);
  assert.deepEqual(progress.upcoming.map((item) => item.title), ["Upcoming task"]);
});

test("summarizes daily progress without shaming incomplete work", () => {
  const response = buildTasksRoutinesResponse(
    "How am I doing today?",
    context([
      task({ title: "Finished one", isCompleted: true }),
      task({ title: "Finished two", isCompleted: true }),
      task({ title: "Finished three", isCompleted: true }),
      task({ title: "Finished four", isCompleted: true }),
      task({ title: "Left one" }),
      task({ title: "Left two" }),
    ])
  );

  assert.match(response, /You've completed 4 of your 6 tasks today/);
  assert.match(response, /2 tasks left/);
  assert.doesNotMatch(response, /failed|should have|bad/i);
});

test("reports finished tasks when asked", () => {
  const response = buildTasksRoutinesResponse(
    "What have I finished?",
    context([
      task({ title: "Pack bag", isCompleted: true }),
      task({ title: "Make breakfast", isCompleted: true }),
      task({ title: "Call the clinic" }),
    ])
  );

  assert.match(response, /You've finished 2 tasks today/);
  assert.match(response, /Pack bag and Make breakfast/);
});

test("reports routine completion and the next routine task", () => {
  const completeResponse = buildTasksRoutinesResponse(
    "Did I complete my routine?",
    context([
      task({ title: "Brush teeth", category: "routine", frequency: "daily", isCompleted: true }),
      task({ title: "Pack bag", category: "routine", frequency: "daily", isCompleted: true }),
    ])
  );
  assert.match(completeResponse, /routine is complete/i);

  const incompleteResponse = buildTasksRoutinesResponse(
    "Help me with my routine.",
    context([
      task({ title: "Brush teeth", category: "routine", frequency: "daily", isCompleted: true }),
      task({
        title: "Pack bag",
        category: "routine",
        frequency: "daily",
        scheduledTime: "11:00",
      }),
    ])
  );
  assert.match(incompleteResponse, /partly complete/i);
  assert.match(incompleteResponse, /next routine task is Pack bag at 11:00 AM/i);
});

test("handles no planned tasks naturally", () => {
  const response = buildTasksRoutinesResponse("What am I missing?", context([]));
  assert.match(response, /don't have any tasks planned/i);
});