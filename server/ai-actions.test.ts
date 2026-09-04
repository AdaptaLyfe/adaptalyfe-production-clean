import assert from "node:assert/strict";
import test from "node:test";
import {
  AdaptAIActionError,
  buildActionContext,
  executeAdaptAIAction,
  isPotentialTaskActionRequest,
  parseAdaptAIAction,
} from "./ai-actions.js";
import type { DailyTask } from "../shared/schema.js";

function task(overrides: Partial<DailyTask> = {}): DailyTask {
  return {
    id: 12,
    userId: 7,
    title: "Buy milk",
    description: "",
    category: "personal_care",
    frequency: "daily",
    estimatedMinutes: 15,
    pointValue: 10,
    scheduledTime: null,
    isCompleted: false,
    completedAt: null,
    dueDate: null,
    lastCompleted: null,
    lastReminderSent: null,
    lastOverdueReminder: null,
    ...overrides,
  };
}

function storageFor(existingTask = task()) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  return {
    calls,
    createDailyTask: async (data: any) => {
      calls.push({ method: "createDailyTask", args: [data] });
      return task({ ...data, id: 99 });
    },
    getTaskById: async (taskId: number) => {
      calls.push({ method: "getTaskById", args: [taskId] });
      return existingTask.id === taskId ? existingTask : undefined;
    },
    updateTaskCompletion: async (taskId: number, isCompleted: boolean) => {
      calls.push({ method: "updateTaskCompletion", args: [taskId, isCompleted] });
      return task({ ...existingTask, isCompleted, completedAt: new Date() });
    },
    updateUserPoints: async (...args: unknown[]) => {
      calls.push({ method: "updateUserPoints", args });
      return {} as any;
    },
  };
}

test("accepts only the two explicit action schemas", () => {
  assert.deepEqual(
    parseAdaptAIAction({
      action: "create_task",
      parameters: { title: "Buy milk", dueDate: "2026-09-05", dueTime: "09:30" },
    }),
    {
      action: "create_task",
      parameters: { title: "Buy milk", dueDate: "2026-09-05", dueTime: "09:30" },
    },
  );

  assert.throws(
    () =>
      parseAdaptAIAction({
        action: "create_task",
        parameters: { title: "Buy milk", sql: "DELETE FROM users" },
      }),
    (error: unknown) =>
      error instanceof AdaptAIActionError && error.code === "invalid_action",
  );

  assert.throws(
    () =>
      parseAdaptAIAction({
        action: "create_task",
        parameters: { title: "Buy milk", dueDate: "2026-02-30" },
      }),
    (error: unknown) =>
      error instanceof AdaptAIActionError && error.code === "invalid_action",
  );
});

test("keeps read-only task questions off the mutation path", () => {
  assert.equal(isPotentialTaskActionRequest("Add buy milk to my tasks tomorrow"), true);
  assert.equal(isPotentialTaskActionRequest("Mark my task Buy milk complete"), true);
  assert.equal(isPotentialTaskActionRequest("What tasks do I have left?"), false);
  assert.equal(isPotentialTaskActionRequest("Did I complete my routine?"), false);
});

test("requires confirmation before creating a task", async () => {
  const storage = storageFor();

  await assert.rejects(
    () =>
      executeAdaptAIAction(
        {
          action: "create_task",
          parameters: { title: "Buy milk", dueDate: "2026-09-05" },
        },
        7,
        storage,
        { confirmed: false },
      ),
    (error: unknown) =>
      error instanceof AdaptAIActionError &&
      error.code === "confirmation_required",
  );
  assert.equal(storage.calls.length, 0);
});

test("creates a daily task with existing task defaults after confirmation", async () => {
  const storage = storageFor();
  const result = await executeAdaptAIAction(
    {
      action: "create_task",
      parameters: { title: "Buy milk", dueDate: "2026-09-05", dueTime: "09:30" },
    },
    7,
    storage,
    { confirmed: true },
  );

  assert.equal(result.success, true);
  assert.equal(result.task.userId, 7);
  assert.equal(result.task.category, "personal_care");
  assert.equal(result.task.frequency, "daily");
  assert.equal(result.task.estimatedMinutes, 15);
  assert.equal(result.task.scheduledTime, "09:30");
  assert.equal(storage.calls[0]?.method, "createDailyTask");
});

test("verifies ownership before completing a task and awards points only after success", async () => {
  const ownedStorage = storageFor(task({ id: 12, userId: 7 }));
  const result = await executeAdaptAIAction(
    { action: "complete_task", parameters: { taskId: 12 } },
    7,
    ownedStorage,
    { confirmed: true },
  );
  assert.equal(result.message, "Marked “Buy milk” as complete.");
  assert.deepEqual(
    ownedStorage.calls.map((call) => call.method),
    ["getTaskById", "updateTaskCompletion", "updateUserPoints"],
  );

  const otherUsersTaskStorage = storageFor(task({ id: 12, userId: 8 }));
  await assert.rejects(
    () =>
      executeAdaptAIAction(
        { action: "complete_task", parameters: { taskId: 12 } },
        7,
        otherUsersTaskStorage,
        { confirmed: true },
      ),
    (error: unknown) =>
      error instanceof AdaptAIActionError && error.code === "not_owned",
  );
  assert.deepEqual(
    otherUsersTaskStorage.calls.map((call) => call.method),
    ["getTaskById"],
  );
});

test("does not complete an already completed task", async () => {
  const storage = storageFor(task({ isCompleted: true }));

  await assert.rejects(
    () =>
      executeAdaptAIAction(
        { action: "complete_task", parameters: { taskId: 12 } },
        7,
        storage,
        { confirmed: true },
      ),
    (error: unknown) =>
      error instanceof AdaptAIActionError &&
      error.code === "already_completed",
  );
  assert.deepEqual(
    storage.calls.map((call) => call.method),
    ["getTaskById"],
  );
});

test("action context exposes only task targets for controlled completion", () => {
  const context = buildActionContext([
    task({
      id: 12,
      dueDate: new Date("2026-09-05T00:00:00.000Z"),
      scheduledTime: "09:30",
    }),
  ]);

  assert.deepEqual(context, {
    dailyTasks: [
      {
        id: 12,
        title: "Buy milk",
        dueDate: "2026-09-05",
        dueTime: "09:30",
        isCompleted: false,
      },
    ],
  });
});