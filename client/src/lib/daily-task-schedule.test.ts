import test from "node:test";
import assert from "node:assert/strict";
import { isDailyTaskScheduledForDate } from "./daily-task-schedule";

const createdAt = "2026-09-15T10:00:00.000Z";

test("daily tasks do not appear before their creation date", () => {
  const task = { frequency: "daily", createdAt, dueDate: null };

  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-14"), false);
  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-15"), true);
  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-16"), true);
});

test("weekly and monthly tasks appear only on their scheduled date", () => {
  const task = {
    frequency: "weekly",
    createdAt,
    dueDate: "2026-09-18T10:00:00.000Z",
  };

  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-17"), false);
  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-18"), true);
  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-19"), false);
});

test("tasks without a schedule are not placed on calendar dates", () => {
  const task = { frequency: "monthly", createdAt, dueDate: null };

  assert.equal(isDailyTaskScheduledForDate(task, "2026-09-15"), false);
});