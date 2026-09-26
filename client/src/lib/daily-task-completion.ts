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
  if (completionDates.length > 0) {
    return completionDates.includes(dateKey);
  }
  return task.isCompleted === true;
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