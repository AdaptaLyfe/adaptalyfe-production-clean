import assert from "node:assert/strict";
import test from "node:test";

import {
  isDailyTaskCompletedForDate,
  optimisticallyUpdateDailyTaskCompletion,
  updateDailyTaskCompletionDates,
} from "./daily-task-completion";

test("uses the matching date from completion records", () => {
  const task = {
    isCompleted: true,
    completionDates: ["2026-09-23"],
  };

  assert.equal(isDailyTaskCompletedForDate(task, "2026-09-23"), true);
  assert.equal(isDailyTaskCompletedForDate(task, "2026-09-24"), false);
});

test("older completions without date records show only on the day they were done", () => {
  const completedAt = new Date(2026, 8, 24, 10, 30);
  const task = { isCompleted: true, completedAt, completionDates: [] };
  assert.equal(isDailyTaskCompletedForDate(task, "2026-09-24"), true);
  assert.equal(isDailyTaskCompletedForDate(task, "2026-09-23"), false);
  assert.equal(isDailyTaskCompletedForDate(task, "2026-09-10"), false);
  assert.equal(
    isDailyTaskCompletedForDate({ isCompleted: false }, "2026-09-24"),
    false,
  );
});

test("optimistic completion updates only the selected date", () => {
  const completionDates = ["2026-09-23"];
  const completedToday = updateDailyTaskCompletionDates(
    completionDates,
    "2026-09-24",
    true,
  );
  const uncompletedToday = updateDailyTaskCompletionDates(
    completedToday,
    "2026-09-24",
    false,
  );

  assert.deepEqual(completedToday, ["2026-09-23", "2026-09-24"]);
  assert.deepEqual(uncompletedToday, ["2026-09-23"]);
  assert.deepEqual(completionDates, ["2026-09-23"]);
});

test("the shared optimistic task update keeps list and calendar fields aligned", () => {
  const task = {
    id: 12,
    frequency: "daily",
    isCompleted: false,
    completionDates: ["2026-09-23"],
  };

  const completed = optimisticallyUpdateDailyTaskCompletion(
    task,
    "2026-09-24",
    true,
  );
  assert.equal(completed.isCompleted, true);
  assert.equal(
    isDailyTaskCompletedForDate(completed, "2026-09-24"),
    true,
  );
  assert.equal(
    isDailyTaskCompletedForDate(completed, "2026-09-25"),
    false,
  );

  const uncompleted = optimisticallyUpdateDailyTaskCompletion(
    completed,
    "2026-09-24",
    false,
  );
  assert.equal(uncompleted.isCompleted, false);
  assert.equal(
    isDailyTaskCompletedForDate(uncompleted, "2026-09-24"),
    false,
  );
  assert.deepEqual(uncompleted.completionDates, ["2026-09-23"]);
});