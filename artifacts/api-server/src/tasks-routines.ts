import type { AdaptAIContext, AiTask } from "./ai-context.js";

export type TaskProgress = {
  total: number;
  completed: number;
  incomplete: number;
  completedTasks: AiTask[];
  overdue: AiTask[];
  scheduled: AiTask[];
  upcoming: AiTask[];
  routines: AiTask[];
  completedRoutines: AiTask[];
  incompleteRoutines: AiTask[];
};

function timeMinutes(time?: string): number | undefined {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function isRoutineTask(task: AiTask): boolean {
  const category = task.category.toLowerCase();
  const frequency = task.frequency.toLowerCase();
  return (
    category.includes("routine") ||
    category.includes("morning") ||
    category.includes("evening") ||
    frequency === "daily"
  );
}

function isOverdue(task: AiTask, context: AdaptAIContext): boolean {
  if (task.dueDate && task.dueDate < context.today.date) return true;

  const scheduled = timeMinutes(task.scheduledTime);
  const current = timeMinutes(context.today.time);
  return scheduled !== undefined && current !== undefined && scheduled < current;
}

function sortByScheduledTime(tasks: AiTask[]): AiTask[] {
  return [...tasks].sort((a, b) => {
    const aTime = timeMinutes(a.scheduledTime);
    const bTime = timeMinutes(b.scheduledTime);
    if (aTime === undefined && bTime === undefined) return 0;
    if (aTime === undefined) return 1;
    if (bTime === undefined) return -1;
    return aTime - bTime;
  });
}

/**
 * Calculate task and routine status from the Context Engine projection.
 * This function is read-only and does not infer a task priority or mutate
 * completion state.
 */
export function calculateTaskProgress(context: AdaptAIContext): TaskProgress {
  const tasks = context.tasks?.today ?? [];
  const completed = tasks.filter((task) => task.isCompleted);
  const incomplete = tasks.filter((task) => !task.isCompleted);
  const scheduled = sortByScheduledTime(tasks.filter((task) => task.scheduledTime));
  const upcoming = sortByScheduledTime(
    incomplete.filter((task) => {
      const scheduledTime = timeMinutes(task.scheduledTime);
      const currentTime = timeMinutes(context.today.time);
      return (
        scheduledTime !== undefined &&
        currentTime !== undefined &&
        scheduledTime >= currentTime
      );
    })
  );
  const routines = tasks.filter(isRoutineTask);
  const completedRoutines = routines.filter((task) => task.isCompleted);
  const incompleteRoutines = routines.filter((task) => !task.isCompleted);

  return {
    total: tasks.length,
    completed: completed.length,
    incomplete: incomplete.length,
    completedTasks: completed,
    overdue: sortByScheduledTime(incomplete.filter((task) => isOverdue(task, context))),
    scheduled,
    upcoming,
    routines,
    completedRoutines,
    incompleteRoutines,
  };
}

function formatTaskTime(task: AiTask): string {
  const time = timeMinutes(task.scheduledTime);
  if (time === undefined) return "without a set time";
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `at ${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function taskNames(tasks: AiTask[], max = 3): string {
  const names = tasks.slice(0, max).map((task) => task.title);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names[2]}`;
}

function routineResponse(progress: TaskProgress): string {
  if (progress.routines.length === 0) {
    return "I don't see any routine tasks planned for today.";
  }

  if (progress.incompleteRoutines.length === 0) {
    return `Your routine is complete today. You finished all ${progress.routines.length} routine ${progress.routines.length === 1 ? "task" : "tasks"}.`;
  }

  const completedCount = progress.completedRoutines.length;
  const remaining = progress.incompleteRoutines.length;
  const nextRoutine = progress.upcoming[0] && progress.incompleteRoutines.includes(progress.upcoming[0])
    ? progress.upcoming[0]
    : progress.incompleteRoutines[0];
  const progressText = `Your routine is partly complete. You've finished ${completedCount} of ${progress.routines.length} routine ${progress.routines.length === 1 ? "task" : "tasks"}, with ${remaining} left.`;
  return `${progressText} Your next routine task is ${nextRoutine.title} ${formatTaskTime(nextRoutine)}.`;
}

function progressResponse(progress: TaskProgress): string {
  if (progress.total === 0) {
    return "You don't have any tasks planned for today. You can start small whenever you're ready.";
  }

  if (progress.incomplete === 0) {
    return `You've completed all ${progress.total} of your tasks today. Nice work.`;
  }

  const remainingText = `${progress.incomplete} ${progress.incomplete === 1 ? "task" : "tasks"} left`;
  const summary = `You've completed ${progress.completed} of your ${progress.total} tasks today. You have ${remainingText}.`;
  if (progress.overdue.length === 0) return summary;

  const overdueText = `One overdue task is ${progress.overdue[0].title}.`;
  return `${summary} ${overdueText}`;
}

function completedResponse(progress: TaskProgress): string {
  if (progress.completed === 0) {
    return "You haven't marked any tasks complete today yet. That's okay—your next step can be small.";
  }

  return `You've finished ${progress.completed} ${progress.completed === 1 ? "task" : "tasks"} today: ${taskNames(
    progress.completedTasks
  )}.`;
}

function leftResponse(progress: TaskProgress): string {
  if (progress.incomplete === 0) {
    return progress.total === 0
      ? "You don't have any tasks planned for today."
      : "You don't have any tasks left today. Nice work.";
  }

  const summary = `You have ${progress.incomplete} ${progress.incomplete === 1 ? "task" : "tasks"} left today.`;
  if (progress.overdue.length > 0) {
    return `${summary} One overdue task is ${progress.overdue[0].title}. You can take it one step at a time.`;
  }
  if (progress.upcoming.length > 0) {
    return `${summary} Your next scheduled task is ${progress.upcoming[0].title} ${formatTaskTime(progress.upcoming[0])}.`;
  }
  return `${summary} You can choose one small task to get started.`;
}

/**
 * Recognize questions about task status, routines, and daily progress.
 * More specific Next Action and Today Briefing requests are handled by their
 * own modules before this intent is evaluated.
 */
export function isTasksRoutinesRequest(message: string): boolean {
  const normalized = message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
  return [
    /\bwhat tasks do i have left\b/,
    /\bwhat have i finished\b/,
    /\bdid i complete my routine\b/,
    /\bhelp me with my routine\b/,
    /\bwhat am i missing\b/,
    /\bhow am i doing today\b/,
    /\btask(?:s)?\b.*\b(?:complete|completed|finished|left|missing|progress)\b/,
    /\broutine\b.*\b(?:complete|completed|help|finish|finished)\b/,
  ].some((pattern) => pattern.test(normalized));
}

/**
 * Build a short, supportive task/routine response from existing context.
 * No task is created, completed, or otherwise modified.
 */
export function buildTasksRoutinesResponse(
  message: string,
  context: AdaptAIContext
): string {
  const progress = calculateTaskProgress(context);
  const normalized = message.toLowerCase();

  if (normalized.includes("routine")) return routineResponse(progress);
  if (normalized.includes("finished") || normalized.includes("complete")) {
    return normalized.includes("routine")
      ? routineResponse(progress)
      : completedResponse(progress);
  }
  if (normalized.includes("left") || normalized.includes("missing")) {
    return leftResponse(progress);
  }
  return progressResponse(progress);
}