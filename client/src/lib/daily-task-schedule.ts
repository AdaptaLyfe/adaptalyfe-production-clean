import type { DailyTask } from "@shared/schema";

type ScheduledDailyTask = Pick<DailyTask, "frequency" | "createdAt" | "dueDate">;

function getLocalDateKey(value: Date | string): string {
  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnly && !value.includes("T")) return dateOnly[1];
  }

  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Determines whether a task has an occurrence on a local calendar date.
 *
 * Daily tasks recur from their creation date forward. Tasks with an explicit
 * due date are shown only on that scheduled date unless they are daily tasks,
 * whose recurrence takes precedence.
 */
export function isDailyTaskScheduledForDate(
  task: ScheduledDailyTask,
  date: Date | string,
): boolean {
  const frequency = task.frequency || "daily";
  const dateKey = getLocalDateKey(date);

  if (frequency === "daily") {
    if (!task.createdAt) return true;
    return dateKey >= getLocalDateKey(task.createdAt);
  }

  if (!task.dueDate) return false;
  return getLocalDateKey(task.dueDate) === dateKey;
}