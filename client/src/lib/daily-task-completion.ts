export interface DailyTaskCompletionState {
  isCompleted: boolean | null;
  frequency?: string | null;
  completedAt?: Date | string | null;
  completionDates?: readonly string[] | null;
}

export function isDailyTaskCompletedForDate(
  task: DailyTaskCompletionState,
  dateKey: string,
): boolean {
  const completionDates = task.completionDates ?? [];
  if (completionDates.includes(dateKey)) return true;
  if (task.isCompleted !== true) return false;
  // Older completions have no per-date record. "isCompleted" then only means
  // "done today", so show it on the day it was completed — not on every day.
  const completedAt = task.completedAt ? new Date(task.completedAt) : null;
  const completedKey = completedAt && Number.isFinite(completedAt.getTime())
    ? localDateKey(completedAt)
    : localDateKey(new Date());
  return completedKey === dateKey;
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function updateDailyTaskCompletionDates(
  completionDates: readonly string[] | null | undefined,
  dateKey: string,
  isCompleted: boolean,
): string[] {
  const updatedDates = new Set(completionDates ?? []);
  if (isCompleted) {
    updatedDates.add(dateKey);
  } else {
    updatedDates.delete(dateKey);
  }
  return [...updatedDates];
}

export function optimisticallyUpdateDailyTaskCompletion<
  T extends DailyTaskCompletionState,
>(task: T, dateKey: string, isCompleted: boolean): T {
  return {
    ...task,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null,
    ...((task.frequency === "daily" || !task.frequency)
      ? {
          completionDates: updateDailyTaskCompletionDates(
            task.completionDates,
            dateKey,
            isCompleted,
          ),
        }
      : {}),
  } as T;
}